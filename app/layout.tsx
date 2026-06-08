import "../styles/globals.css";
import { Analytics } from '@vercel/analytics/next';


export const metadata = {
    title: "KFC VALM Liniers",
    description: "Escanea tickets y agregalos al excel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
        <body>
            {children}
            <Analytics />
        </body>
        </html>
    );
}
