const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

function generateIndividualPDF(reportData, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=appraisal_${reportData.user.employeeCode || reportData.user.id}.pdf`);

  doc.pipe(res);

  const primaryColor = '#2c3e50';
  const secondaryColor = '#34495e';
  const accentColor = '#3498db';
  const lightBg = '#f8f9fa';
  const borderColor = '#e9ecef';

  const appraisal = reportData.appraisal || {};
  const cycleName = appraisal.cycle?.name || 'Appraisal Cycle';

  // --- Header ---
  doc.fillColor(primaryColor)
     .fontSize(24)
     .font('Helvetica-Bold')
     .text('APPRAISAL REPORT', { align: 'center', characterSpacing: 2 });
  
  doc.fillColor(accentColor)
     .fontSize(14)
     .font('Helvetica')
     .text(cycleName.toUpperCase(), { align: 'center', characterSpacing: 1 });
  
  doc.moveDown(2);

  // --- Employee Information Section ---
  doc.fillColor(primaryColor)
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('Employee Information');
  
  doc.rect(50, doc.y + 5, 495, 65).fillAndStroke(lightBg, borderColor);
  
  doc.fillColor(secondaryColor).fontSize(10).font('Helvetica');
  const infoY = doc.y + 15;
  doc.text(`Name:`, 65, infoY, { continued: true }).font('Helvetica-Bold').text(` ${reportData.user.name}`, { continued: false });
  doc.font('Helvetica').text(`Email:`, 65, infoY + 18, { continued: true }).font('Helvetica-Bold').text(` ${reportData.user.email || 'N/A'}`, { continued: false });
  doc.font('Helvetica').text(`Employee Code:`, 300, infoY, { continued: true }).font('Helvetica-Bold').text(` ${reportData.user.employeeCode || 'N/A'}`, { continued: false });
  doc.font('Helvetica').text(`Department:`, 300, infoY + 18, { continued: true }).font('Helvetica-Bold').text(` ${reportData.user.department || 'N/A'}`, { continued: false });
  
  doc.moveDown(4);

  // --- Performance Summary Section ---
  doc.fillColor(primaryColor)
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('Performance Summary', 50, doc.y);
  
  doc.rect(50, doc.y + 5, 495, 80).fillAndStroke(lightBg, borderColor);
  
  const sumY = doc.y + 15;
  
  // Final Score & Band
  doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('FINAL SCORE', 65, sumY);
  doc.fillColor(accentColor).fontSize(22).text(`${appraisal.finalScore != null ? appraisal.finalScore : 'N/A'}`, 65, sumY + 15, { continued: true })
     .fillColor(secondaryColor).fontSize(12).text(' / 5');
     
  doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('RATING BAND', 180, sumY);
  doc.fillColor(accentColor).fontSize(16).text(`${appraisal.ratingBand || 'N/A'}`, 180, sumY + 20);

  // Component Scores
  doc.fillColor(secondaryColor).fontSize(9).font('Helvetica');
  doc.text(`KPA Score (60%): ${appraisal.kpaScore != null ? (appraisal.kpaScore / 20).toFixed(2) : 'N/A'} / 5`, 350, sumY);
  doc.text(`Values Score (20%): ${appraisal.valuesScore != null ? appraisal.valuesScore : 'N/A'} / 5`, 350, sumY + 15);
  doc.text(`Competencies Score (20%): ${appraisal.competenciesScore != null ? appraisal.competenciesScore : 'N/A'} / 5`, 350, sumY + 30);
  
  doc.moveDown(5);

  // Helper function for section headers
  const addSectionHeader = (title) => {
    // Check if we need a new page
    if (doc.y > 700) doc.addPage();
    doc.fillColor(primaryColor)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(title, 50, doc.y);
    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke(borderColor);
    doc.moveDown(1);
  };

  // Helper function to group items by ratedBy
  const groupRatingsByOfficer = (ratings) => {
    const grouped = {};
    if (ratings && ratings.length > 0) {
      ratings.forEach(r => {
        if (!grouped[r.ratedBy]) grouped[r.ratedBy] = [];
        grouped[r.ratedBy].push(r);
      });
    }
    return grouped;
  };

  // Helper function to determine officer relationship
  const getOfficerTitle = (officerId) => {
    if (officerId === reportData.user.reportingOfficerId) return 'REPORTING OFFICER';
    if (officerId === reportData.user.reviewingOfficerId) return 'REVIEWING OFFICER';
    if (officerId === reportData.user.acceptingOfficerId) return 'ACCEPTING OFFICER';
    
    // Fallback if somehow they are not assigned
    const officer = reportData.officerMap ? reportData.officerMap[officerId] : null;
    return officer ? officer.role.replace('_', ' ') : `OFFICER`;
  };

  const kpasByOfficer = groupRatingsByOfficer(appraisal.kpaRatings);

  // --- KPAs Section ---
  addSectionHeader('Key Performance Areas (KPAs)');
  
  if (Object.keys(kpasByOfficer).length > 0) {
    Object.keys(kpasByOfficer).forEach(officerId => {
      const officerTitle = getOfficerTitle(officerId);
      
      if (doc.y > 700) doc.addPage();
      doc.fillColor(accentColor).fontSize(12).font('Helvetica-Bold').text(officerTitle, 50, doc.y);
      doc.moveDown(1);
      
      kpasByOfficer[officerId].forEach((kr, index) => {
        if (doc.y > 720) doc.addPage();
        
        const kpaTitle = kr.kpaGoal?.title || 'Unknown KPA';
        const weight = kr.kpaGoal?.weightage || 0;
        
        const startY = doc.y;
        
        doc.fillColor(secondaryColor).fontSize(11).font('Helvetica-Bold')
           .text(`${index + 1}. ${kpaTitle}`, 50, startY, { width: 380 });
        
        const afterTitleY = doc.y;
        
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
           .text(`Rating: ${kr.rating}`, 450, startY, { align: 'right', width: 95 });
           
        doc.y = Math.max(afterTitleY, doc.y);
        
        doc.fillColor('#7f8c8d').fontSize(9).font('Helvetica')
           .text(`Weightage: ${weight}%`, 50, doc.y);
        
        if (kr.remarks) {
          doc.moveDown(0.5);
          doc.fillColor(secondaryColor).fontSize(10).font('Helvetica-Oblique')
             .text(`" ${kr.remarks} "`, 65, doc.y, { width: 450 });
        } else {
          doc.x = 50;
        }
        
        doc.moveDown(1.5);
      });
    });
  } else {
    doc.fillColor(secondaryColor).fontSize(11).font('Helvetica').text('No KPAs scored yet.', 50, doc.y);
    doc.moveDown(2);
  }

  // --- Attributes Section ---
  doc.moveDown(1);
  addSectionHeader('Attributes (Values & Competencies)');

  const attrsByOfficer = groupRatingsByOfficer(appraisal.attributeRatings);

  if (Object.keys(attrsByOfficer).length > 0) {
    Object.keys(attrsByOfficer).forEach(officerId => {
      const officerTitle = getOfficerTitle(officerId);
      
      if (doc.y > 700) doc.addPage();
      doc.fillColor(accentColor).fontSize(12).font('Helvetica-Bold').text(officerTitle, 50, doc.y);
      doc.moveDown(1);

      attrsByOfficer[officerId].forEach((ar, index) => {
        if (doc.y > 720) doc.addPage();
        
        const attrName = ar.attribute?.name || 'Unknown Attribute';
        const attrType = ar.attribute?.type || 'General';
        
        const startY = doc.y;
        
        doc.fillColor(secondaryColor).fontSize(11).font('Helvetica-Bold')
           .text(`${index + 1}. ${attrName} `, 50, startY, { width: 380, continued: true })
           .fillColor('#7f8c8d').font('Helvetica').fontSize(9).text(`(${attrType})`);
           
        const afterTitleY = doc.y;
           
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
           .text(`Rating: ${ar.rating} / 5`, 450, startY, { align: 'right', width: 95 });
        
        doc.y = Math.max(afterTitleY, doc.y);
        
        if (ar.remarks) {
          doc.moveDown(0.5);
          doc.fillColor(secondaryColor).fontSize(10).font('Helvetica-Oblique')
             .text(`" ${ar.remarks} "`, 65, doc.y, { width: 450 });
        } else {
          doc.x = 50;
        }
        
        doc.moveDown(1.5);
      });
    });
  } else {
    doc.fillColor(secondaryColor).fontSize(11).font('Helvetica').text('No attributes scored yet.', 50, doc.y);
  }

  // Footer on all pages
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor('#bdc3c7')
       .text(`Generated on ${new Date().toLocaleDateString()} | ePMS System`, 50, 780, { align: 'center' });
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
