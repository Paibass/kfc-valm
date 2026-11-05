import "../styles/globals.css";
import { Analytics } from '@vercel/analytics/next';
import { LocalIdentityProvider } from "@/components/LocalIdentity";

export const metadata = {
    title: "KFC VALM",
    description: "Escanea tickets y agregalos al excel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
        <body>
            <LocalIdentityProvider>{children}</LocalIdentityProvider>
            <Analytics />
        </body>
        </html>
    );
}
