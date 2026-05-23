import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-muted">
      <Container className="py-8 text-sm text-text-subtle flex flex-col sm:flex-row gap-2 sm:gap-6 justify-between">
        <span>
          © {new Date().getFullYear()} — Demo only, no PHI is processed or stored.
        </span>
        <span className="space-x-4">
          <a href="mailto:mrglenncarter@gmail.com" className="hover:text-text">
            Contact
          </a>
        </span>
      </Container>
    </footer>
  );
}
