import jsPDF from 'jspdf';

export const generateCertificate = ({ username, quizTitle, score, date }) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(255, 215, 0);
  doc.setLineWidth(4);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');
  doc.setLineWidth(2);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');

  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 215, 0);
  doc.text('Certificate of Achievement', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(90);
  doc.text('🏆', pageWidth / 2, 85, { align: 'center' });

  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('This is to certify that', pageWidth / 2, 110, { align: 'center' });

  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 100, 200);
  doc.text(username, pageWidth / 2, 130, { align: 'center' });

  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(`has successfully completed the quiz`, pageWidth / 2, 150, { align: 'center' });
  doc.text(`"${quizTitle}"`, pageWidth / 2, 165, { align: 'center' });
  doc.text(`with a score of ${score}%`, pageWidth / 2, 180, { align: 'center' });

  doc.setFontSize(18);
  doc.text(`Date: ${date}`, pageWidth / 2, 205, { align: 'center' });

  doc.save(`Certificate_${username}_${quizTitle.replace(/\s+/g, '_')}.pdf`);
};
