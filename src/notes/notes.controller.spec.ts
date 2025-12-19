import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { MockService } from 'src/common/types/mock.types';
import { NoteTag } from './enums/note-tag.enum';
import { CreateNoteDto } from './dto/create-note.dto';
import { Request } from 'express';
import { Note } from './entities/note.entity';
import { User } from 'src/users/entities/user.entity';
import { QueryNoteDto, SortBy } from './dto/query-note-dto';
import { SortOrder } from 'src/common/enums/sort-order.enum';
import { createPaginatedResponse } from 'src/common/utils/pagination.util';
import { UpdateNoteDto } from './dto/update-note.dto';

function mockServiceFactory<T extends object>(): MockService<T> {
  return {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as MockService<T>;
}

function mockNoteFactory(props: Partial<Note> = {}): Note {
  return {
    id: 1,
    title: 'Test Note',
    content: 'Homework',
    isDone: false,
    tag: NoteTag.Work,
    user: { id: 1 } as User,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...props,
  };
}

describe('NotesController', () => {
  let controller: NotesController;

  let mockNotesService: MockService<NotesService>;

  const userId = 1;
  const mockRequest = {
    user: { id: userId },
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: mockServiceFactory<NotesService>(),
        },
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    mockNotesService = module.get(NotesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNoteTags', () => {
    it('should return array of note tags', () => {
      const result = controller.getNoteTags();
      expect(result).toEqual(Object.values(NoteTag));
    });
  });

  describe('create', () => {
    it('should successfully create note', async () => {
      const createNoteDto: CreateNoteDto = {
        title: 'Note',
        content: 'This is main note for developers',
      };

      const mockNote = mockNoteFactory({
        ...createNoteDto,
        ...mockRequest.user,
      });
      mockNotesService.create?.mockResolvedValue(mockNote);

      const result = await controller.create(createNoteDto, mockRequest);
      expect(result).toEqual(mockNote);

      expect(mockNotesService.create).toHaveBeenCalledWith(
        createNoteDto,
        userId,
      );
    });
  });

  describe('findAll', () => {
    it('should return notes by query', async () => {
      const queryDto: QueryNoteDto = {
        page: 1,
        perPage: 10,
        sortBy: SortBy.Title,
        sortOrder: SortOrder.ASC,
      };

      const mockNotes = [mockNoteFactory({ user: { id: userId } as User })];
      const mockTotal = 1;
      const mockResult: [Note[], number] = [mockNotes, mockTotal];
      const expectedResponse = createPaginatedResponse(
        mockResult,
        queryDto.page,
        queryDto.perPage,
      );
      mockNotesService.findAll?.mockResolvedValue(expectedResponse);

      const result = await controller.findAll(queryDto, mockRequest);
      expect(result).toEqual(expectedResponse);

      expect(mockNotesService.findAll).toHaveBeenCalledWith(queryDto, userId);
    });
  });

  describe('findOne', () => {
    it('should return specific note by id', async () => {
      const noteId = 5;

      const mockNote = mockNoteFactory({
        id: noteId,
      });
      mockNotesService.findOne?.mockResolvedValue(mockNote);

      const result = await controller.findOne(noteId, mockRequest);
      expect(result).toEqual(mockNote);

      expect(mockNotesService.findOne).toHaveBeenCalledWith(noteId, userId);
    });
  });

  describe('update', () => {
    it('should successfully update note', async () => {
      const noteId = 5;

      const updateNoteDto: UpdateNoteDto = {
        title: 'New title',
      };
      const mockNote = mockNoteFactory({
        id: noteId,
        ...updateNoteDto,
      });
      mockNotesService.update?.mockResolvedValue(mockNote);

      const result = await controller.update(
        noteId,
        updateNoteDto,
        mockRequest,
      );
      expect(result).toEqual(mockNote);

      expect(mockNotesService.update).toHaveBeenCalledWith(
        noteId,
        updateNoteDto,
        userId,
      );
    });
  });

  describe('remove', () => {
    it('should successfully remove note by id', async () => {
      const noteId = 5;

      mockNotesService.remove?.mockResolvedValue(undefined);

      const result = await controller.remove(noteId, mockRequest);
      expect(result).toEqual(undefined);

      expect(mockNotesService.remove).toHaveBeenCalledWith(noteId, userId);
    });
  });
});
