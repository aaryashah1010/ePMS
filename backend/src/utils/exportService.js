const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

function generateIndividualPDF(reportData, res) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=appraisal_${reportData.user.employeeCode}.pdf`);

  doc.pipe(res);

  doc.fontSize(20).text('Employee Appraisal Report', { align: 'center' });
  doc.moveDown();

  const appraisal = reportData.appraisal || {};

  doc.fontSize(14).text(`Name: ${reportData.user.name}`);
  doc.text(`Employee Code: ${reportData.user.employeeCode || 'N/A'}`);
  doc.text(`Department: ${reportData.user.department || 'N/A'}`);
  doc.text(`Final Score: ${appraisal.finalScore != null ? appraisal.finalScore + ' / 5' : 'N/A'}`);
  doc.text(`Rating Band: ${appraisal.ratingBand || 'N/A'}`);
  doc.moveDown();

  doc.fontSize(16).text('KPAs', { underline: true });
  if (appraisal.kpaRatings && appraisal.kpaRatings.length > 0) {
    appraisal.kpaRatings.forEach(kr => {
      doc.fontSize(12).text(`- ${kr.kpaGoal?.title || 'Unknown KPA'} (Weight: ${kr.kpaGoal?.weightage || 0}%)`);
      doc.text(`  Rating: ${kr.rating}`);
      if (kr.remarks) doc.text(`  Remarks: ${kr.remarks}`);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(12).text('No KPAs scored yet.');
  }
  doc.moveDown();

  doc.fontSize(16).text('Attributes', { underline: true });
  if (appraisal.attributeRatings && appraisal.attributeRatings.length > 0) {
    appraisal.attributeRatings.forEach(ar => {
      doc.fontSize(12).text(`- ${ar.attribute?.name || 'Unknown'} (${ar.attribute?.type || ''})`);
      doc.text(`  Rating: ${ar.rating} / 5`);
      if (ar.remarks) doc.text(`  Remarks: ${ar.remarks}`);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(12).text('No attributes scored yet.');
  }

  doc.end();
}

async function generateDepartmentExcel(summaryData, res) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Department Summary');

  sheet.columns = [
    { header: 'Employee Name', key: 'name', width: 25 },
    { header: 'Employee Code', key: 'code', width: 15 },
    { header: 'Department', key: 'dept', width: 20 },
    { header: 'Final Score', key: 'score', width: 15 },
    { header: 'Rating Band', key: 'band', width: 20 },
  ];

  summaryData.forEach(dept => {
    dept.employees.forEach(emp => {
      sheet.addRow({
        name: emp.name,
        code: emp.employeeCode || 'N/A',
        dept: dept.department || 'N/A',
        score: emp.finalScore ?? 'Pending',
        band: emp.ratingBand || 'Pending'
      });
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=department_summary.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { generateIndividualPDF, generateDepartmentExcel };
