import { INestApplication } from '@nestjs/common';
import { createTestApp, TestApp } from './utils/setup';
import request from 'supertest';
import { App } from 'supertest/types';
import { createBearerAuth, registerUser } from './utils/helpers';
import { Note } from 'src/notes/entities/note.entity';
import { NoteTag } from 'src/notes/enums/note-tag.enum';
import { CreateNoteDto } from 'src/notes/dto/create-note.dto';
import { createPaginatedResponse } from 'src/common/utils/pagination';
import { UpdateNoteDto } from 'src/notes/dto/update-note.dto';
import { ResponseTokens } from './types/tokens.types';

describe('NotesModule (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let userTokens: ResponseTokens;
  let createdNoteId: number;
  let bearer: string;

  const responseNote = {
    id: expect.any(Number) as number,
    title: 'Mock note',
    content: 'General description of note',
    isDone: false,
    tag: NoteTag.Health,
    updatedAt: expect.any(String) as string,
    createdAt: expect.any(String) as string,
  };

  const createNoteDto: CreateNoteDto = {
    title: responseNote.title,
    content: responseNote.content,
    tag: responseNote.tag,
    isDone: responseNote.isDone,
  };

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    await testApp.cleanup();

    userTokens = await registerUser(app);
    bearer = createBearerAuth(userTokens.accessToken);
  });

  afterAll(async () => {
    await testApp.close();
  });

  describe('CRUD Operations', () => {
    it('should create a new note (201)', () => {
      return request(app.getHttpServer() as App)
        .post('/notes')
        .set('Authorization', bearer)
        .send(createNoteDto)
        .expect(201)
        .expect((res) => {
          createdNoteId = (res.body as { id: number }).id;
          expect(res.body).toEqual(responseNote);
        });
    });
    it('should get a list of notes with pagination (200)', () => {
      return request(app.getHttpServer() as App)
        .get('/notes')
        .set('Authorization', bearer)
        .expect(200)
        .expect((res) => {
          const expectedResponse = createPaginatedResponse<Note>(
            [[responseNote as unknown as Note], 1],
            1,
            10,
          );
          expect(res.body).toEqual(expectedResponse);
        });
    });
    it('should get a single note by ID (200)', () => {
      return request(app.getHttpServer() as App)
        .get(`/notes/${createdNoteId}`)
        .set('Authorization', bearer)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(responseNote);
        });
    });
    it('should update the note title and content (200)', async () => {
      const prevResponse = await request(app.getHttpServer() as App)
        .get(`/notes/${createdNoteId}`)
        .set('Authorization', bearer)
        .expect(200);

      const prevBody = prevResponse.body as unknown as { updatedAt: string };
      const prevUpdatedAt = new Date(prevBody.updatedAt).getTime();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updateNoteDto: UpdateNoteDto = {
        title: 'updated_' + responseNote.title,
        content: 'updated_' + responseNote.content,
      };
      return request(app.getHttpServer() as App)
        .patch(`/notes/${createdNoteId}`)
        .set('Authorization', bearer)
        .send(updateNoteDto)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown as {
            updatedAt: string;
            createdAt: string;
          };
          const updatedAt = new Date(body.updatedAt).getTime();
          const createdAt = new Date(body.createdAt).getTime();

          expect(body).toEqual({ ...responseNote, ...updateNoteDto });
          expect(updatedAt).toBeGreaterThan(createdAt);
          expect(updatedAt).toBeGreaterThan(prevUpdatedAt);
        });
    });
    it('should delete the note (204)', () => {
      return request(app.getHttpServer() as App)
        .delete(`/notes/${createdNoteId}`)
        .set('Authorization', bearer)
        .expect(204)
        .expect((res) => {
          expect(res.body).toEqual({});
        });
    });
    it('should return 404 when trying to get the deleted note', () => {
      return request(app.getHttpServer() as App)
        .delete(`/notes/${createdNoteId}`)
        .set('Authorization', bearer)
        .expect(404);
    });
  });

  describe('Validation', () => {
    it('should fail to create note with empty title (400)', () => {
      return request(app.getHttpServer() as App)
        .post('/notes')
        .set('Authorization', bearer)
        .send({ ...createNoteDto, title: '' })
        .expect(400);
    });
  });

  describe('Security (Access Control)', () => {
    let newUserTokens: ResponseTokens;

    let newBearer: string;
    beforeAll(async () => {
      newUserTokens = await registerUser(app);
      newBearer = createBearerAuth(newUserTokens.accessToken);

      const response = await request(app.getHttpServer() as App)
        .post('/notes')
        .set('Authorization', bearer)
        .send(createNoteDto)
        .expect(201);
      const body = response.body as { id: number };
      createdNoteId = body.id;
    });

    it("should forbid User B from viewing User A's note (404)", () => {
      return request(app.getHttpServer() as App)
        .get(`/notes/${createdNoteId}`)
        .set('Authorization', newBearer)
        .expect(404);
    });

    it("should forbid User B from updating User A's note (404)", () => {
      const updateNoteDto: UpdateNoteDto = {
        title: 'updated' + responseNote.title,
      };

      return request(app.getHttpServer() as App)
        .patch(`/notes/${createdNoteId}`)
        .set('Authorization', newBearer)
        .send(updateNoteDto)
        .expect(404);
    });
    it("should forbid User B from deleting User A's note (404)", () => {
      return request(app.getHttpServer() as App)
        .delete(`/notes/${createdNoteId}`)
        .set('Authorization', newBearer)
        .expect(404);
    });
  });
});
