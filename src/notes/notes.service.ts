import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Note } from './entities/note.entity';
import { Repository } from 'typeorm';

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

  async findAll(): Promise<Note[]> {
    return this.noteRepository.find();
  }

  async findOne(id: number) {
    const note = await this.noteRepository.findOneBy({ id });

    if (!note) {
      throw new NotFoundException(`Note with ID #${id} not found`);
    }
    return note;
  }

  async update(id: number, updateNoteDto: UpdateNoteDto) {
    const note = await this.noteRepository.preload({
      id: id,
      ...updateNoteDto,
    });

    if (!note) {
      throw new NotFoundException(`Note with ID #${id} not found`);
    }

    return this.noteRepository.save(note);
  }

  async remove(id: number) {
    const note = await this.findOne(id);

    await this.noteRepository.remove(note);
  }
}
