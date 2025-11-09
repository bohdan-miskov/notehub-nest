import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Note } from './entities/note.entity';
import { Like, Repository } from 'typeorm';
import { QueryNoteDto } from './dto/query-note-dto';
import {
  createPaginatedResponse,
  PaginatedResult,
} from 'src/common/utils/pagination.util';
import { NoteTag } from './enums/note-tag.enum';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
  ) {}

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    const note = this.noteRepository.create(createNoteDto);
    return this.noteRepository.save(note);
  }

  async findAll(queryDto: QueryNoteDto): Promise<PaginatedResult<Note>> {
    const {
      page = 1,
      perPage = 10,
      search,
      tag,
      isDone,
      sortBy = 'id',
      sortOrder = 'DESC',
    } = queryDto;

    const skip = (page - 1) * perPage;
    const take = perPage;

    const where: {
      tag?: NoteTag;
      isDone?: boolean;
    } = {};

    if (tag !== undefined) {
      where.tag = tag;
    }

    if (isDone !== undefined) {
      where.isDone = isDone;
    }

    let finalWhere: any[] = [where];

    if (search) {
      finalWhere = [
        { ...where, title: Like(`%${search}%`) },
        { ...where, content: Like(`%${search}%`) },
      ];
    }

    const order = { [sortBy]: sortOrder };

    const data = await this.noteRepository.findAndCount({
      where: finalWhere,
      order: order,
      skip: skip,
      take: take,
    });

    return createPaginatedResponse<Note>(data, page, perPage);
  }

  async findOne(id: number): Promise<Note> {
    const note = await this.noteRepository.findOneBy({ id });

    if (!note) {
      throw new NotFoundException(`Note with ID #${id} not found`);
    }
    return note;
  }

  async update(id: number, updateNoteDto: UpdateNoteDto): Promise<Note> {
    const note = await this.noteRepository.preload({
      id: id,
      ...updateNoteDto,
    });

    if (!note) {
      throw new NotFoundException(`Note with ID #${id} not found`);
    }

    return this.noteRepository.save(note);
  }

  async remove(id: number): Promise<void> {
    const note = await this.findOne(id);

    await this.noteRepository.remove(note);
  }
}
