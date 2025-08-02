import { Test, TestingModule } from '@nestjs/testing';
import { CloudnaryController } from './cloudnary.controller';

describe('CloudnaryController', () => {
  let controller: CloudnaryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CloudnaryController],
    }).compile();

    controller = module.get<CloudnaryController>(CloudnaryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
