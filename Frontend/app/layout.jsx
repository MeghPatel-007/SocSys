import "../src/styles/output.css";

export const metadata = {
  title: "SocSys",
  description: "Society Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
