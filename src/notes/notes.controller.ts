import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteTag } from './enums/note-tag.enum';
import { QueryNoteDto } from './dto/query-note-dto';
import { AuthGuard } from '@nestjs/passport';
import { type Request } from 'express';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Note } from './entities/note.entity';

@ApiTags('2. Notes')
@ApiCookieAuth('accessToken')
@ApiResponse({
  status: 401,
  description: 'Tokens are invalid or expired',
})
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @ApiResponse({
    status: 200,
    description: 'Tags successfully found',
    schema: {
      type: 'array',
      items: {
        type: 'string',
        enum: Object.values(NoteTag),
        example: NoteTag.Work,
      },
    },
  })
  @Get('tags')
  getNoteTags() {
    return Object.values(NoteTag);
  }

  @ApiResponse({
    status: 201,
    description: 'Note successfully created',
    type: Note,
  })
  @ApiResponse({
    status: 400,
    description: 'Your data is invalid',
  })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createNoteDto: CreateNoteDto, @Req() req: Request) {
    const userId = req.user?.id as number;
    return this.notesService.create(createNoteDto, userId);
  }

  @ApiResponse({
    status: 200,
    description: 'Notes successfully found',
    type: [Note],
  })
  @ApiResponse({
    status: 400,
    description: 'Your query is invalid',
  })
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Query() queryDto: QueryNoteDto, @Req() req: Request) {
    const userId = req.user?.id as number;
    return this.notesService.findAll(queryDto, userId);
  }

  @ApiResponse({
    status: 200,
    description: 'Note successfully found',
    type: Note,
  })
  @ApiResponse({
    status: 404,
    description: 'Note is not found',
  })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req.user?.id as number;
    return this.notesService.findOne(id, userId);
  }

  @ApiResponse({
    status: 200,
    description: 'Note successfully updated',
    type: Note,
  })
  @ApiResponse({
    status: 400,
    description: 'Your data is invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Note is not found',
  })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id as number;
    return this.notesService.update(id, updateNoteDto, userId);
  }

  @ApiResponse({ status: 204, description: 'Note successfully deleted' })
  @HttpCode(204)
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req.user?.id as number;
    return this.notesService.remove(id, userId);
  }
}
