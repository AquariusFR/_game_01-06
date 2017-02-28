import { TestBed, inject } from '@angular/core/testing';
import { GetShaderService } from './get-shader.service';

describe('GetShaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GetShaderService]
    });
  });

  it('should ...', inject([GetShaderService], (service: GetShaderService) => {
    expect(service).toBeTruthy();
  }));
});
