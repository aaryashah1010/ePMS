const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { loadModule } = require('../../helpers/module');
const { createAsyncSpy, createSpy, createRes } = require('../../helpers/spies');

const modulePath = path.join(__dirname, '../../../src/utils/exportService.js');

test('generateIndividualPDF writes headers and streams appraisal sections', () => {
  const writes = [];

  class FakePDFDocument {
    pipe(target) {
      this.target = target;
    }

    fontSize() {
      return this;
    }

    text(value) {
      writes.push(value);
      return this;
    }

    moveDown() {
      return this;
    }

    end() {
      this.ended = true;
    }
  }

  const { generateIndividualPDF } = loadModule(modulePath, {
    pdfkit: FakePDFDocument,
    exceljs: { Workbook: class Workbook {} },
  });

  const res = createRes();
  generateIndividualPDF({
    user: { name: 'Alice', employeeCode: 'EMP001', department: 'Engineering' },
    appraisal: {
      finalScore: 88,
      ratingBand: 'Good',
      kpaRatings: [{ rating: 30, kpaGoal: { title: 'Delivery', weightage: 30 } }],
      attributeRatings: [{ rating: 4, attribute: { name: 'Teamwork', type: 'VALUES' } }],
    },
  }, res);

  assert.equal(res.headers['Content-Type'], 'application/pdf');
  assert.match(res.headers['Content-Disposition'], /appraisal_EMP001\.pdf/);
  assert.ok(writes.some((value) => value.includes('Employee Appraisal Report')));
  assert.ok(writes.some((value) => value.includes('Delivery')));
  assert.ok(writes.some((value) => value.includes('Teamwork')));
});

test('generateDepartmentExcel writes rows and closes the response', async () => {
  const rows = [];
  const write = createAsyncSpy(async () => undefined);

  class FakeWorkbook {
    constructor() {
      this.xlsx = { write };
    }

    addWorksheet() {
      return {
        set columns(value) {
          this._columns = value;
        },
        addRow(row) {
          rows.push(row);
        },
      };
    }
  }

  const { generateDepartmentExcel } = loadModule(modulePath, {
    pdfkit: class FakePDFDocument {},
    exceljs: { Workbook: FakeWorkbook },
  });

  const res = createRes();
  await generateDepartmentExcel([
    {
      department: 'Engineering',
      employees: [
        { name: 'Alice', employeeCode: 'EMP001', finalScore: 91, ratingBand: 'Outstanding' },
      ],
    },
  ], res);

  assert.equal(res.headers['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'Alice');
  assert.equal(write.calls.length, 1);
  assert.equal(res.ended, true);
});
