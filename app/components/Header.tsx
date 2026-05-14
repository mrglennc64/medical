import Link from "next/link";
import { Container } from "./Container";

const NAV = [
  { href: "/demo", label: "Demo" },
  { href: "/architecture", label: "Architecture" },
  { href: "https://github.com/mrglennc64/medical", label: "GitHub", external: true },
];

export function Header() {
  return (
    <header className="border-b border-border bg-bg/80 backdrop-blur sticky top-0 z-40">
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-text">
          <span className="inline-block h-6 w-6 rounded-md bg-brand" aria-hidden />
          <span>AI Medical Coding</span>
          <span className="text-text-subtle font-normal">— Glenn Carter</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm text-text-muted hover:text-text"
              >
                {item.label} ↗
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-sm text-text-muted hover:text-text"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </Container>
    </header>
  );
}
