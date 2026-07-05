import Link from "next/link";

const links = [
  { label: "Home", href: "/" },
  { label: "Showcase", href: "/showcase" },
  { label: "Upload", href: "/upload" },
  { label: "Pricing", href: "/#pricing" },
];

const StudioNavbar = () => {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between rounded-xl border bg-white px-4">
      <Link href="/" className="flex items-center gap-2">
        <img
          src="/logo/logo.png"
          alt="Logo"
          className="h-8 w-8 rounded-full object-cover"
          width={32}
          height={32}
        />
        <span className="text-base font-medium tracking-tight">Ascii Studio</span>
      </Link>

      <nav className="flex items-center gap-1">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default StudioNavbar;
