/**
 * Capture and upload.
 *
 * Images are downscaled before they leave the phone: a 12MP prescription photo
 * is 4 MB of mostly paper, and Gemini reads a 1600px version exactly as well
 * for a fraction of the upload time on a Madurai 4G connection.
 */

import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { Audio } from 'expo-av';
import { ref, uploadString } from 'firebase/storage';

import { uploadPath } from '@dfc/core';
import { isConfigured, storage } from './firebase';

export interface Capture {
  uri: string;
  base64: string;
  mimeType: string;
  /** Extension used for the Storage object name. */
  ext: string;
  sizeBytes: number;
}

const rid = () => Math.random().toString(36).slice(2, 12);

// ---------------------------------------------------------------------------
// Camera / library
// ---------------------------------------------------------------------------

async function fromPickerResult(
  result: ImagePicker.ImagePickerResult,
): Promise<Capture | null> {
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (!asset.base64) return null;

  return {
    uri: asset.uri,
    base64: asset.base64,
    mimeType: asset.mimeType ?? 'image/jpeg',
    ext: (asset.mimeType ?? 'image/jpeg').includes('png') ? 'png' : 'jpg',
    sizeBytes: asset.fileSize ?? Math.round((asset.base64.length * 3) / 4),
  };
}

export async function takePhoto(): Promise<Capture | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Camera permission is needed to read a prescription.');

  return fromPickerResult(
    await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      // A prescription is a document — let people straighten it.
      allowsEditing: true,
      exif: false,
    }),
  );
}

export async function pickPhoto(): Promise<Capture | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Photo access is needed to attach a list.');

  return fromPickerResult(
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      exif: false,
    }),
  );
}

// ---------------------------------------------------------------------------
// Voice
// ---------------------------------------------------------------------------

let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<void> {
  const perm = await Audio.requestPermissionsAsync();
  if (!perm.granted) throw new Error('Microphone permission is needed to speak your order.');

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording: rec } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  recording = rec;
}

export interface VoiceCapture extends Capture {
  durationMs: number;
}

export async function stopRecording(): Promise<VoiceCapture | null> {
  if (!recording) return null;

  const status = await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  if (!uri) return null;

  // SDK 54 replaced readAsStringAsync with the File handle API.
  const base64 = await new File(uri).base64();

  return {
    uri,
    base64,
    // The HIGH_QUALITY preset records AAC in an MPEG-4 container on both
    // platforms, which Gemini accepts as audio/mp4.
    mimeType: 'audio/mp4',
    ext: 'm4a',
    sizeBytes: Math.round((base64.length * 3) / 4),
    durationMs: status.durationMillis ?? 0,
  };
}

export function isRecording(): boolean {
  return recording !== null;
}

export async function cancelRecording(): Promise<void> {
  if (!recording) return;
  try {
    await recording.stopAndUnloadAsync();
  } catch {
    /* already stopped */
  }
  recording = null;
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

/**
 * Uploads the captured file and returns its Storage path.
 *
 * The model call does NOT wait on this — the base64 already went straight to
 * Gemini. The upload exists so an admin can look at what the customer actually
 * sent when the model gets it wrong.
 *
 * Uploads the base64 we are already holding rather than re-reading the file.
 * The obvious `fetch(capture.uri).blob()` reads well but leans on React
 * Native's `file://` + Blob support, which is solid on iOS and patchy across
 * Android OEM builds; when it broke it threw, got swallowed by the catch
 * below, and returned a path with nothing behind it — so the admin opening a
 * misread prescription found a dead link and no clue why. `uploadString` goes
 * through the same XHR on both platforms and touches no filesystem bridge.
 */
export async function uploadCapture(uid: string, capture: Capture): Promise<string> {
  const path = uploadPath(uid, rid(), capture.ext);
  if (!isConfigured) {
    return path;
  }
  try {
    await uploadString(ref(storage(), path), capture.base64, 'base64', {
      contentType: capture.mimeType,
    });
  } catch {
    // Best effort by design: this is an audit copy, and failing it must never
    // cost the customer the order they are in the middle of placing.
  }
  return path;
}
