import {
  FileTypeValidator,
  Injectable,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';

@Injectable()
export class ParseImagePipe extends ParseFilePipe {
  constructor() {
    super({
      validators: [
        new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
        new FileTypeValidator({ fileType: 'image/(jpeg|png|jpg)' }),
      ],
      fileIsRequired: false,
    });
  }
}
