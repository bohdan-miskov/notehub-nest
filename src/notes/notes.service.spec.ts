import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { Like } from 'typeorm';
import { Note } from './entities/note.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteTag } from './enums/note-tag.enum';
import { UpdateNoteDto } from './dto/update-note.dto';
import { User } from 'src/users/entities/user.entity';
import { QueryNoteDto, SortBy } from './dto/query-note-dto';
import { createPaginatedResponse } from 'src/common/utils/pagination';
import { SortOrder } from 'src/common/enums/sort-order.enum';
import { MockRepository } from 'src/common/types/mock.types';

function mockRepositoryFactory(): MockRepository<Note> {
  return {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    preload: jest.fn(),
  };
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

describe('NotesService', () => {
  let service: NotesService;
  let repository: MockRepository<Note>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: getRepositoryToken(Note),
          useValue: mockRepositoryFactory(),
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    repository = module.get<MockRepository<Note>>(getRepositoryToken(Note));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated notes with default values', async () => {
      const userId = 1;
      const query = new QueryNoteDto();
      const mockNotes = [mockNoteFactory({ user: { id: userId } as User })];
      const mockTotal = 1;
      const mockResult: [Note[], number] = [mockNotes, mockTotal];

      repository.findAndCount?.mockResolvedValue(mockResult);

      const expectedResponse = createPaginatedResponse(
        mockResult,
        query.page,
        query.perPage,
      );

      const result = await service.findAll(query, userId);

      expect(result).toEqual(expectedResponse);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: [{ user: { id: userId } }],
        order: { id: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
    it('should build query with pagination', async () => {
      const userId = 1;
      const query = new QueryNoteDto();
      query.page = 3;
      query.perPage = 15;
      const mockNotes = [mockNoteFactory({ user: { id: userId } as User })];
      const mockTotal = 1;
      const mockResult: [Note[], number] = [mockNotes, mockTotal];

      repository.findAndCount?.mockResolvedValue(mockResult);

      const expectedResponse = createPaginatedResponse(
        mockResult,
        query.page,
        query.perPage,
      );

      const result = await service.findAll(query, userId);

      expect(result).toEqual(expectedResponse);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: [{ user: { id: userId } }],
        order: { id: 'DESC' },
        skip: 30,
        take: 15,
      });
    });
    it('should build query with filters', async () => {
      const userId = 1;
      const query = new QueryNoteDto();
      query.tag = NoteTag.Work;
      query.isDone = false;
      const mockNotes = [mockNoteFactory({ user: { id: userId } as User })];
      const mockTotal = 1;
      const mockResult: [Note[], number] = [mockNotes, mockTotal];

      repository.findAndCount?.mockResolvedValue(mockResult);

      const expectedResponse = createPaginatedResponse(
        mockResult,
        query.page,
        query.perPage,
      );

      const result = await service.findAll(query, userId);

      expect(result).toEqual(expectedResponse);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: [
          {
            tag: NoteTag.Work,
            isDone: false,
            user: { id: userId },
          },
        ],
        order: { id: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
    it('should build query with sorting', async () => {
      const userId = 1;
      const query = new QueryNoteDto();
      query.sortBy = SortBy.Title;
      query.sortOrder = SortOrder.ASC;
      const mockNotes = [mockNoteFactory({ user: { id: userId } as User })];
      const mockTotal = 1;
      const mockResult: [Note[], number] = [mockNotes, mockTotal];

      repository.findAndCount?.mockResolvedValue(mockResult);

      const expectedResponse = createPaginatedResponse(
        mockResult,
        query.page,
        query.perPage,
      );

      const result = await service.findAll(query, userId);

      expect(result).toEqual(expectedResponse);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: [
          {
            user: { id: userId },
          },
        ],
        order: { title: 'ASC' },
        skip: 0,
        take: 10,
      });
    });
    it('should build query with search', async () => {
      const userId = 1;
      const query = new QueryNoteDto();
      query.search = 'Note';
      const mockNotes = [mockNoteFactory({ user: { id: userId } as User })];
      const mockTotal = 1;
      const mockResult: [Note[], number] = [mockNotes, mockTotal];

      repository.findAndCount?.mockResolvedValue(mockResult);

      const expectedResponse = createPaginatedResponse(
        mockResult,
        query.page,
        query.perPage,
      );

      const result = await service.findAll(query, userId);

      expect(result).toEqual(expectedResponse);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: [
          {
            title: Like(`%Note%`),
            user: { id: userId },
          },
          {
            content: Like(`%Note%`),
            user: { id: userId },
          },
        ],
        order: { id: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
    it('should build query with search, filters, pagination and sorting', async () => {
      const userId = 1;
      const query: QueryNoteDto = {
        search: 'test',
        tag: NoteTag.Health,
        isDone: true,
        page: 4,
        perPage: 16,
        sortBy: SortBy.CreatedAt,
        sortOrder: SortOrder.DESC,
      };
      const mockNotes = [mockNoteFactory({ user: { id: userId } as User })];
      const mockTotal = 1;
      const mockResult: [Note[], number] = [mockNotes, mockTotal];

      repository.findAndCount?.mockResolvedValue(mockResult);

      const expectedResponse = createPaginatedResponse(
        mockResult,
        query.page,
        query.perPage,
      );

      const result = await service.findAll(query, userId);

      expect(result).toEqual(expectedResponse);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: [
          {
            title: Like(`%test%`),
            tag: NoteTag.Health,
            isDone: true,
            user: { id: userId },
          },
          {
            content: Like(`%test%`),
            tag: NoteTag.Health,
            isDone: true,
            user: { id: userId },
          },
        ],
        order: { createdAt: 'DESC' },
        skip: 48,
        take: 16,
      });
    });
  });

  describe('findOne', () => {
    it('should find a note by id and user id', async () => {
      const userId = 1;
      const noteId = 1;

      const mockNote = mockNoteFactory({
        id: noteId,
        user: { id: userId } as User,
      });

      repository.findOneBy?.mockResolvedValue(mockNote);

      const result = await service.findOne(noteId, userId);

      expect(result).toEqual(mockNote);
      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: noteId,
        user: { id: userId },
      });
    });

    it('should throw NotFoundException if note not found', async () => {
      const userId = 1;
      const noteId = 999;

      repository.findOneBy?.mockResolvedValue(null);

      await expect(service.findOne(noteId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should successfully create and save a new note', async () => {
      const userId = 1;

      const createNoteDto: CreateNoteDto = {
        title: 'Test Note',
        content: 'Homework',
        tag: NoteTag.Work,
      };

      const mockNoteToCreate = {
        ...createNoteDto,
        isDone: false,
        user: { id: userId } as User,
      };

      repository.create?.mockReturnValue(mockNoteToCreate);

      const mockNoteToSave = mockNoteFactory(mockNoteToCreate);

      repository.save?.mockResolvedValue(mockNoteToSave);

      const result = await service.create(createNoteDto, userId);

      expect(result).toEqual(mockNoteToSave);

      expect(repository.create).toHaveBeenCalledWith({
        ...createNoteDto,
        user: { id: userId },
      });
      expect(repository.save).toHaveBeenCalledWith(mockNoteToCreate);
    });
  });

  describe('update', () => {
    it('should successfully update a note', async () => {
      const noteId = 1;
      const userId = 1;

      const mockNote = mockNoteFactory({
        id: noteId,
        user: { id: userId } as User,
      });

      repository.findOneBy?.mockResolvedValue(mockNote);

      const updateNoteDto: UpdateNoteDto = {
        title: 'Updated test note',
      };

      const updatedNote = {
        ...mockNote,
        ...updateNoteDto,
      };

      repository.preload?.mockResolvedValue(updatedNote);

      repository.save?.mockResolvedValue(updatedNote);

      const result = await service.update(noteId, updateNoteDto, userId);

      expect(result).toEqual(updatedNote);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: noteId,
        user: { id: userId },
      });
      expect(repository.preload).toHaveBeenCalledWith(updatedNote);
      expect(repository.save).toHaveBeenCalledWith(updatedNote);
    });
    it('should throw NotFoundException if note not found', async () => {
      const userId = 1;
      const noteId = 999;

      const updateNoteDto: UpdateNoteDto = {
        title: 'Updated test note',
      };

      repository.findOneBy?.mockResolvedValue(null);

      await expect(
        service.update(noteId, updateNoteDto, userId),
      ).rejects.toThrow(NotFoundException);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: noteId,
        user: { id: userId },
      });
    });
  });

  describe('remove', () => {
    it('should successfully remove a note', async () => {
      const noteId = 1;
      const userId = 1;

      const mockNote = mockNoteFactory({
        id: noteId,
        user: { id: userId } as User,
      });

      repository.findOneBy?.mockResolvedValue(mockNote);

      // repository.remove?.mockResolvedValue(mockNote);

      const result = await service.remove(noteId, userId);

      expect(result).toEqual(undefined);

      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: noteId,
        user: { id: userId },
      });
      expect(repository.remove).toHaveBeenCalledWith(mockNote);
    });
    it('should throw NotFoundException if note not found', async () => {
      const userId = 1;
      const noteId = 999;

      repository.findOneBy?.mockResolvedValue(null);

      await expect(service.remove(noteId, userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.findOneBy).toHaveBeenCalledWith({
        id: noteId,
        user: { id: userId },
      });
    });
  });
});
