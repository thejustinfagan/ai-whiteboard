import './globals.css';

export const metadata = {
  title: 'AI Whiteboard - Sketch to Spec',
  description: 'Draw on the canvas, let AI turn it into functional specs, wireframes, or diagrams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
