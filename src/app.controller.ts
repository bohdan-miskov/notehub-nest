import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController() // Ховаємо цей контролер зі Swagger
@Controller()
export class AppController {
  @Get()
  @Redirect('/docs', 301)
  root() {}
}
