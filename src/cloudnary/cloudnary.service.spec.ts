import { Test, TestingModule } from '@nestjs/testing';
import { CloudnaryService } from './cloudnary.service';

describe('CloudnaryService', () => {
  let service: CloudnaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudnaryService],
    }).compile();

    service = module.get<CloudnaryService>(CloudnaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
