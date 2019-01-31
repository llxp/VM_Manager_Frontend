import { TestBed } from '@angular/core/testing';

import { VmoperationsService } from './vmoperations.service';

describe('VmoperationsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VmoperationsService = TestBed.get(VmoperationsService);
    expect(service).toBeTruthy();
  });
});
