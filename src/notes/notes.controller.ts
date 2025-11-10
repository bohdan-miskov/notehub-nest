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

@UseGuards(AuthGuard('jwt'))
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('tags')
  getNoteTags() {
    return Object.values(NoteTag);
  }

  @Post()
  create(@Body() createNoteDto: CreateNoteDto, @Req() req: Request) {
    const userId = req.user?.id as number;
    return this.notesService.create(createNoteDto, userId);
  }

  @Get()
  findAll(@Query() queryDto: QueryNoteDto, @Req() req: Request) {
    const userId = req.user?.id as number;
    return this.notesService.findAll(queryDto, userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req.user?.id as number;
    return this.notesService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id as number;
    return this.notesService.update(id, updateNoteDto, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const userId = req.user?.id as number;
    return this.notesService.remove(id, userId);
  }
}
