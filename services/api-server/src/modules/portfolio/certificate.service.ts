import { portfolioRepository } from "./portfolio.repository";
import { Certificate, InsertCertificate } from "@edusphere/types";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import { v4 as uuidv4 } from "uuid";

export class CertificateService {
    /**
     * Generates a unique verification code for a certificate
     */
    private generateVerificationCode(): string {
        return `CERT-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now().toString().substring(7)}`;
    }

    /**
     * Creates a new certificate record and generates the digital assets
     */
    async issueCertificate(data: Omit<InsertCertificate, "verificationCode">): Promise<Certificate> {
        const verificationCode = this.generateVerificationCode();

        const certificate = await portfolioRepository.createCertificate({
            ...data,
            verificationCode,
        });

        return certificate;
    }

    /**
     * Generates a QR code data URL for verification
     */
    async generateVerificationQR(code: string): Promise<string> {
        const baseUrl = process.env.APP_URL || "http://localhost:3000";
        const verifyUrl = `${baseUrl}/verify/${code}`;
        return await QRCode.toDataURL(verifyUrl);
    }

    /**
     * Generates a PDF buffer for the certificate
     */
    async generateCertificatePDF(certificate: Certificate, studentName: string): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            const chunks: any[] = [];
            const doc = new PDFDocument({
                layout: "landscape",
                size: "A4",
                margin: 0
            });

            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            // Background / Border
            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
                .lineWidth(5)
                .stroke("#4F46E5");

            // Header
            doc.fontSize(40)
                .fillColor("#111827")
                .text("CERTIFICATE OF COMPLETION", 0, 100, { align: "center" });

            doc.fontSize(20)
                .fillColor("#6B7280")
                .text("This is to certify that", 0, 180, { align: "center" });

            // Student Name
            doc.fontSize(35)
                .fillColor("#4F46E5")
                .text(studentName, 0, 220, { align: "center" });

            doc.fontSize(18)
                .fillColor("#6B7280")
                .text(`has successfully completed the requirements for`, 0, 280, { align: "center" });

            doc.fontSize(24)
                .fillColor("#111827")
                .text(certificate.title, 0, 310, { align: "center" });

            // Footer
            doc.fontSize(14)
                .fillColor("#9CA3AF")
                .text(`Issued by ${certificate.issuerName} on ${certificate.issuedAt?.toLocaleDateString()}`, 0, 400, { align: "center" });

            // QR Code
            const qrDataUrl = await this.generateVerificationQR(certificate.verificationCode);
            const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
            doc.image(qrBuffer, doc.page.width - 120, doc.page.height - 120, { width: 80 });

            doc.fontSize(10)
                .text(`Verify at: edusphere.ac/verify/${certificate.verificationCode}`, doc.page.width - 150, doc.page.height - 35);

            doc.end();
        });
    }

    /**
     * Retrieves all certificates for a student
     */
    async getStudentCertificates(studentId: string): Promise<Certificate[]> {
        return await portfolioRepository.getCertificatesByStudent(studentId);
    }

    /**
     * Verifies a certificate by its code
     */
    async verifyCertificate(code: string): Promise<Certificate | null> {
        return await portfolioRepository.getCertificateByCode(code);
    }
}

export const certificateService = new CertificateService();
