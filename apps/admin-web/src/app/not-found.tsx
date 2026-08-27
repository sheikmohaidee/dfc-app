import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-lg font-semibold tracking-tight text-primary-foreground">
          D
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[21px] font-semibold tracking-tight">Nothing at this address</h1>
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">
            That page does not exist. The board, the live map, stock and promotions are all
            reachable from the header.
          </p>
        </div>
        <Link
          href="/"
          className="flex h-10 items-center rounded-lg bg-primary px-5 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to the board
        </Link>
      </div>
    </main>
  );
}
