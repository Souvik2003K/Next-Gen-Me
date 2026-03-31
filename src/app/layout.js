import './globals.css';

export const metadata = {
  title: "Souvik Moitra | Portfolio",
  description:
    "Terminal-style portfolio of Souvik Moitra – ASE at IBM, Full-Stack Developer.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="page-root">
          {children}
        </div>
      </body>
    </html>
  );
}