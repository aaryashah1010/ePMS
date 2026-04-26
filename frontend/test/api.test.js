import { describe, it, expect } from 'vitest';
import api, { authAPI, userAPI, cycleAPI, kpaAPI, appraisalAPI, attributeAPI, reportAPI } from '../src/services/api';

describe('API Service', () => {
  describe('Authentication API', () => {
    it('has login method', () => {
      expect(authAPI.login).toBeDefined();
    });

    it('has me method', () => {
      expect(authAPI.me).toBeDefined();
    });

    it('has changePassword method', () => {
      expect(authAPI.changePassword).toBeDefined();
    });
  });

  describe('User API', () => {
    it('has getAll method', () => {
      expect(userAPI.getAll).toBeDefined();
    });

    it('has getById method', () => {
      expect(userAPI.getById).toBeDefined();
    });

    it('has create method', () => {
      expect(userAPI.create).toBeDefined();
    });

    it('has update method', () => {
      expect(userAPI.update).toBeDefined();
    });

    it('has getProfile method', () => {
      expect(userAPI.getProfile).toBeDefined();
    });

    it('has getReportees method', () => {
      expect(userAPI.getReportees).toBeDefined();
    });

    it('has getReviewees method', () => {
      expect(userAPI.getReviewees).toBeDefined();
    });

    it('has getAppraisees method', () => {
      expect(userAPI.getAppraisees).toBeDefined();
    });
  });

  describe('Cycle API', () => {
    it('has getAll method', () => {
      expect(cycleAPI.getAll).toBeDefined();
    });

    it('has getActive method', () => {
      expect(cycleAPI.getActive).toBeDefined();
    });

    it('has create method', () => {
      expect(cycleAPI.create).toBeDefined();
    });

    it('has update method', () => {
      expect(cycleAPI.update).toBeDefined();
    });

    it('has delete method', () => {
      expect(cycleAPI.delete).toBeDefined();
    });

    it('has advancePhase method', () => {
      expect(cycleAPI.advancePhase).toBeDefined();
    });
  });

  describe('KPA API', () => {
    it('has getMy method', () => {
      expect(kpaAPI.getMy).toBeDefined();
    });

    it('has create method', () => {
      expect(kpaAPI.create).toBeDefined();
    });

    it('has update method', () => {
      expect(kpaAPI.update).toBeDefined();
    });

    it('has delete method', () => {
      expect(kpaAPI.delete).toBeDefined();
    });

    it('has submit method', () => {
      expect(kpaAPI.submit).toBeDefined();
    });

    it('has getTeam method', () => {
      expect(kpaAPI.getTeam).toBeDefined();
    });
  });

  describe('Appraisal API', () => {
    it('has getMy method', () => {
      expect(appraisalAPI.getMy).toBeDefined();
    });

    it('has submit method', () => {
      expect(appraisalAPI.submit).toBeDefined();
    });

    it('has getEmployee method', () => {
      expect(appraisalAPI.getEmployee).toBeDefined();
    });

    it('has saveKpaRatings method', () => {
      expect(appraisalAPI.saveKpaRatings).toBeDefined();
    });

    it('has saveAttributeRatings method', () => {
      expect(appraisalAPI.saveAttributeRatings).toBeDefined();
    });

    it('has reportingDone method', () => {
      expect(appraisalAPI.reportingDone).toBeDefined();
    });

    it('has reviewingDone method', () => {
      expect(appraisalAPI.reviewingDone).toBeDefined();
    });

    it('has acceptingDone method', () => {
      expect(appraisalAPI.acceptingDone).toBeDefined();
    });

    it('has updateSelf method', () => {
      expect(appraisalAPI.updateSelf).toBeDefined();
    });
  });

  describe('Attribute API', () => {
    it('has getAll method', () => {
      expect(attributeAPI.getAll).toBeDefined();
    });

    it('has create method', () => {
      expect(attributeAPI.create).toBeDefined();
    });

    it('has update method', () => {
      expect(attributeAPI.update).toBeDefined();
    });

    it('has delete method', () => {
      expect(attributeAPI.delete).toBeDefined();
    });
  });

  describe('Report API', () => {
    it('has progress method', () => {
      expect(reportAPI.progress).toBeDefined();
    });

    it('has individual method', () => {
      expect(reportAPI.individual).toBeDefined();
    });

    it('has department method', () => {
      expect(reportAPI.department).toBeDefined();
    });

    it('has distribution method', () => {
      expect(reportAPI.distribution).toBeDefined();
    });
  });

  describe('API Instance', () => {
    it('has baseURL configured', () => {
      expect(api.defaults.baseURL).toBeDefined();
    });

    it('has timeout configured', () => {
      expect(api.defaults.timeout).toBeDefined();
    });
  });
});
