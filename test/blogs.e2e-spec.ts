import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as jwt from 'jsonwebtoken';
import { Blog } from '../src/blogs/entities/blog.entity';
import { createApp } from '../src/utils/createApp';
import { DataSource, getConnection } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { v4 as uuidv4 } from 'uuid';

const testUser = {
  login: 'artur',
  password: '123456',
  email: 'artur@rambler.ru',
};

let testUserAccessToken: string;
let testUserId: string;

describe('BLOGS ROUTES\n', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await moduleRef.createNestApplication();
    app = createApp(app);
    await app.init();
    server = app.getHttpServer();
    expect(server).toBeDefined();
    const myDataSource = await request(server).delete('/api/testing/all-data');
    await request(server)
      .post('/api/sa/users')
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send(testUser);

    const testUserLoginResult = await request(server)
      .post('/api/auth/login')
      .set({ 'user-agent': 'Mozilla' })
      .send({
        loginOrEmail: 'artur',
        password: '123456',
      });
    testUserAccessToken = testUserLoginResult.body.accessToken;

    const jwtDataUser: any = jwt.verify(
      testUserAccessToken,
      process.env.SECRET!,
    );
    testUserId = jwtDataUser.userId;
  });

  afterAll(async () => {
    await request(server).delete('/api/testing/all-data');
    await app.close();
  });

  describe('Super user blog routes', () => {
    beforeAll(async () => {
      const blogs: any[] = [];

      for (let i = 1; i < 13; i++) {
        blogs.push({
          name: `new blog ${i}`,
          description: `desc ${i}`,
          websiteUrl: `https://google.com`,
          ownerId: testUserId,
        });
      }
      await Promise.all(
        blogs.map(async (blog) => {
          await request(server)
            .post('/api/blogger/blogs')
            .set('Authorization', `Bearer ${testUserAccessToken}`)
            .send(blog)
            .expect(201);
        }),
      );
    });

    afterAll(async () => {
      await request(server).delete('/api/testing/all-blogs');
    });

    describe('GET sa/blogs - return all blogs including ban info with paging ', () => {
      it('should return status 200 and 15 blogs, pagesCount=2, pageSize=10, totalCount=15', async () => {
        const getBlogsRes = await request(server)
          .get('/api/sa/blogs')
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .expect(200);

        expect(getBlogsRes.body.items.length).toBe(10);
        expect(getBlogsRes.body.pagesCount).toBe(2);
        expect(getBlogsRes.body.pageSize).toBe(10);
        expect(getBlogsRes.body.totalCount).toBe(12);
        expect(getBlogsRes.body.items[0].blogOwnerInfo.userId).toBe(testUserId);
        expect(getBlogsRes.body.items[0].blogOwnerInfo.userLogin).toBe(
          testUser.login,
        );
        expect(getBlogsRes.body.items[0]).toHaveProperty('banInfo');
      });

      it('should return 401 status if user is unauthorized', async () => {
        const getBlogsRes = await request(server)
          .get('/api/sa/blogs')
          .set('Authorization', 'Basic invalidPass')
          .expect(401);
      });
    });

    describe('PUT sa/blogs/{id}/ban - Ban/unban blog', () => {
      let blog: Blog;
      beforeAll(async () => {
        const getBlogsRes = await request(server)
          .get('/api/sa/blogs')
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .expect(200);
        blog = getBlogsRes.body.items[0];
      });
      it('should return 204 status and ban blog when "isBanned" send as "true"', async () => {
        await request(server)
          .put(`/api/sa/blogs/${blog.id}/ban`)
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .send({ isBanned: true })
          .expect(204);
        const allBlogs = await request(server)
          .get('/api/sa/blogs')
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .expect(200);
        const updatedBlog = allBlogs.body.items.find(
          (b: any) => b.id === blog.id,
        );
        expect(updatedBlog.banInfo.isBanned).toBe(true);
      });
      it('should return 204 status and unban blog when "isBanned" send as "false"', async () => {
        await request(server)
          .put(`/api/sa/blogs/${blog.id}/ban`)
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .send({ isBanned: false })
          .expect(204);

        const allBlogs = await request(server)
          .get('/api/sa/blogs')
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .expect(200);
        const updatedBlog = allBlogs.body.items.find(
          (b: any) => b.id === blog.id,
        );
        expect(updatedBlog.banInfo.isBanned).toBe(false);
      });

      it('should return 400 status when "isBanned" send as invalid value', async () => {
        await request(server)
          .put(`/api/sa/blogs/${blog.id}/ban`)
          .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
          .send({ isBanned: '' })
          .expect(400);
      });

      it('should return 401 status if user is unauthorized', async () => {
        await request(server)
          .put(`/api/sa/blogs/${blog.id}/ban`)
          .set('Authorization', 'Basic invalidPass')
          .send({ isBanned: true })
          .expect(401);
      });
    });

    //   describe('PUT sa/blogs/{id}/bind-with-user/{userId} - Bind Blog with user (if blog does not have an owner yet)', () => {
    //     const blogToBindDto: Partial<Blog> = {
    //       name: `blog to bind`,
    //       description: `desc`,
    //       websiteUrl: `https://google.com`,
    //       ownerId: undefined,
    //     };
    //     const blogToCheckForInvalidInputDto: Partial<Blog> = {
    //       name: `blog to check`,
    //       description: `for invalid input such as invalid user Id or when blog is already bound`,
    //       websiteUrl: `https://google.com`,
    //       ownerId: undefined,
    //     };
    //     let blogToBind: Blog;
    //     let blogToCheckForInvalidInput: Blog;
    //     let boundBlog: Blog;
    //     beforeAll(async () => {
    //       blogToBind = await blogModel.create(blogToBindDto);
    //       blogToCheckForInvalidInput = await blogModel.create(
    //         blogToCheckForInvalidInputDto,
    //       );
    //     });

    //     it('should return status 204 with valid blogId and userId being passed and bind blog to user', async () => {
    //       await request(server)
    //         .put(`/api/sa/blogs/${blogToBind.id}/bind-with-user/${testUserId}`)
    //         .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
    //         .expect(204);

    //       boundBlog = await blogModel.findById(blogToBind.id);
    //       expect(boundBlog.ownerInfo.userId.toString()).toBe(testUserId);
    //       expect(boundBlog.ownerInfo.userLogin).toBe(testUser.login);
    //     });

    //     it('should return 400 status if inputModel is incorrect or blog is already bound to any user', async () => {
    //       const bindToInvalidUserRes = await request(app.getHttpServer())
    //         .put(
    //           `/api/sa/blogs/${
    //             blogToCheckForInvalidInput.id
    //           }/bind-with-user/${uuidv4()}`,
    //         )
    //         .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
    //         .expect(400);

    //       const bindToAlreadyBoundBlogRes = await request(server)
    //         .put(`/api/sa/blogs/${boundBlog.id}/bind-with-user/${testUserId}`)
    //         .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
    //         .expect(400);
    //     });

    //     it('should return 401 status if sa is unauthorized', async () => {
    //       await request(server)
    //         .put(`/api/sa/blogs/${blogToBind.id}/bind-with-user/${testUserId}`)
    //         .set('Authorization', 'Basic invalidPass')
    //         .expect(401);
    //     });
    //   });
    // });

    // describe('\n    Public users blog routes', () => {
    //   describe('GET /blogs - find all blogs', () => {
    //     it('should return object with default query params, pagesCount = 0, totalCount = 0, items = []', async () => {
    //       await request(app.getHttpServer()).get('/blogs').expect(200, {
    //         pagesCount: 0,
    //         page: 1,
    //         pageSize: 10,
    //         totalCount: 0,
    //         items: [],
    //       });
    //     });

    //     it('given default search params should return 12 blogs, pagesCount = 2, total count = 12, items = 10 items', async () => {
    //       const blogs: any[] = [];

    //       for (let i = 1; i < 13; i++) {
    //         blogs.push({
    //           name: `new blog ${i}`,
    //           description: `desc ${i}`,
    //           websiteUrl: `https://google.com`,
    //         });
    //       }
    //       await Promise.all(
    //         blogs.map(async (blog) => {
    //           const res = await request(app.getHttpServer())
    //             .post('/blogger/blogs')
    //             .set('Authorization', `Bearer ${testUserAccessToken}`)
    //             .send(blog)
    //             .expect(201);
    //         }),
    //       );

    //       const result = await request(app.getHttpServer())
    //         .get('/blogs')
    //         .expect(200);

    //       expect(result.body.pagesCount).toEqual(2);
    //       expect(result.body.page).toEqual(1);
    //       expect(result.body.pageSize).toEqual(10);
    //       expect(result.body.totalCount).toEqual(12);
    //       expect(result.body.items.length).toEqual(10);
    //     });
    //   });

    //   describe('GET /blogs/{id}  - find blog by ID', () => {
    //     const blogToCreate = {
    //       name: 'new blog2',
    //       description: 'desc2',
    //       websiteUrl: 'https://yandex.com',
    //     };
    //     it('should find blog if id is valid', async () => {
    //       const blog = await request(app.getHttpServer())
    //         .post('/blogger/blogs')
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(blogToCreate)
    //         .expect(201);

    //       const result = await request(app.getHttpServer())
    //         .get(`/blogs/${blog.body.id}`)
    //         .expect(200);

    //       expect(result.body).toEqual({
    //         id: blog.body.id,
    //         name: 'new blog2',
    //         description: 'desc2',
    //         websiteUrl: 'https://yandex.com',
    //         createdAt: expect.any(String),
    //         isMembership: false,
    //       });
    //     });

    //     it('should NOT find blog with invalid ID', async () => {
    //       const result = await request(app.getHttpServer())
    //         .get(`/blogs/ffjak`)
    //         .expect(404);
    //     });
    //   });

    //   describe('GET blogger/blogs/{blogId}/posts - get all posts for specified blog', () => {
    //     beforeAll(async () => {
    //       await request(app.getHttpServer()).delete('/testing/all-blogs');
    //     });

    //     const blogToCreate = {
    //       name: 'blog with posts',
    //       description: 'some description',
    //       websiteUrl: 'https://yandex.com',
    //     };
    //     const postsArr: any[] = [];

    //     for (let i = 1; i <= 12; i++) {
    //       postsArr.push({
    //         title: `post ${i}`,
    //         shortDescription: `post ${i} description`,
    //         content: `post ${i} content`,
    //       });
    //     }

    //     it('Should create 12 posts and return 10 of them with default search params', async () => {
    //       const newBlog = await request(app.getHttpServer())
    //         .post('/blogger/blogs')
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(blogToCreate)
    //         .expect(201);

    //       await Promise.all(
    //         postsArr.map(async (post) => {
    //           await request(app.getHttpServer())
    //             .post(`/blogger/blogs/${newBlog.body.id}/posts`)
    //             .set('Authorization', `Bearer ${testUserAccessToken}`)
    //             .send(post)
    //             .expect(201);
    //         }),
    //       );
    //       const result = await request(app.getHttpServer())
    //         .get(`/blogs/${newBlog.body.id}/posts`)
    //         .expect(200);

    //       expect(result.body).toStrictEqual({
    //         pagesCount: 2,
    //         page: 1,
    //         pageSize: 10,
    //         totalCount: 12,
    //         items: expect.any(Array),
    //       });
    //       expect(result.body.items).toHaveLength(10);
    //     });

    //     it('should return 404 code if blog ID doesnt exist', async () => {
    //       const res = await request(app.getHttpServer())
    //         .get(`/blogs/989/posts`)
    //         .expect(404);
    //     });
    //   });
    // });

    // describe('\n    Blogger blogs routes', () => {
    //   describe('POST blogger/blogs - create blog', () => {
    //     it('given invalid blog params (all empty strings) should recieve error object with 3 errors', async () => {
    //       const invalidBlogToCreate = {
    //         name: '',
    //         description: '',
    //         websiteUrl: '',
    //       };

    //       const response = await request(app.getHttpServer())
    //         .post('/blogger/blogs')
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(invalidBlogToCreate)
    //         .expect(400);

    //       const errorBody = response.body;
    //       expect(errorBody).toEqual({
    //         errorsMessages: [
    //           {
    //             message: expect.any(String),
    //             field: 'name',
    //           },
    //           {
    //             message: expect.any(String),
    //             field: 'description',
    //           },
    //           {
    //             message: expect.any(String),
    //             field: 'websiteUrl',
    //           },
    //         ],
    //       });
    //     });

    //     it('given valid blog params should return blog object', async () => {
    //       const blogToCreate = {
    //         name: 'new blog',
    //         description: 'desc',
    //         websiteUrl: 'https://mail.com',
    //       };

    //       const response = await request(app.getHttpServer())
    //         .post('/blogger/blogs')
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(blogToCreate)
    //         .expect(201);
    //       const createdBlog = response.body;

    //       expect(createdBlog).toEqual({
    //         id: expect.any(String),
    //         name: 'new blog',
    //         description: 'desc',
    //         websiteUrl: 'https://mail.com',
    //         createdAt: expect.any(String),
    //         isMembership: false,
    //       });
    //     });
    //   });

    //   describe('POST blogger/blogs/{blogId}/posts - create post for specified blog', () => {
    //     const blogToCreate = {
    //       name: 'new blog',
    //       description: 'blog desc',
    //       websiteUrl: 'https://yandex.com',
    //     };

    //     const postToCreate = {
    //       title: 'post',
    //       shortDescription: 'post description',
    //       content: 'post content',
    //     };

    //     it('Should NOT create post if user is not authorized', async () => {
    //       const newBlog = await request(app.getHttpServer())
    //         .post('/blogger/blogs')
    //         .set('Authorization', `Bearer nnn`)
    //         .send(blogToCreate)
    //         .expect(401);

    //       await request(app.getHttpServer())
    //         .post(`/blogger/blogs/${newBlog.body.id}/posts`)
    //         .set('Authorization', `Bearer nnn`)
    //         .send(postToCreate)
    //         .expect(401);
    //     });

    //     it('Should NOT create post if blog ID is invalid', async () => {
    //       const fakeObjectId = new Types.ObjectId();

    //       await request(app.getHttpServer())
    //         .post(`/blogger/blogs/${fakeObjectId}/posts`)
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(postToCreate)
    //         .expect(404);
    //     });

    //     it('Should create post for blog', async () => {
    //       const newBlog = await request(app.getHttpServer())
    //         .post('/blogger/blogs')
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(blogToCreate)
    //         .expect(201);

    //       const result = await request(app.getHttpServer())
    //         .post(`/blogger/blogs/${newBlog.body.id}/posts`)
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(postToCreate)
    //         .expect(201);

    //       expect(result.body).toStrictEqual({
    //         id: expect.any(String),
    //         title: 'post',
    //         shortDescription: 'post description',
    //         content: 'post content',
    //         blogId: newBlog.body.id,
    //         blogName: 'new blog',
    //         createdAt: expect.stringMatching(
    //           /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/,
    //         ),
    //         extendedLikesInfo: {
    //           likesCount: 0,
    //           dislikesCount: 0,
    //           myStatus: 'None',
    //           newestLikes: [],
    //         },
    //       });
    //     });
    //   });

    //   describe('PUT blogger/blogs/{id} - update existing blog by ID', () => {
    //     const blogToCreate = {
    //       name: 'new blog3',
    //       description: 'desc3',
    //       websiteUrl: 'https://yandex.com',
    //     };

    //     it('Should update blog if blog ID is valid', async () => {
    //       const result = await request(app.getHttpServer())
    //         .post('/blogger/blogs')
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(blogToCreate)
    //         .expect(201);

    //       await request(app.getHttpServer())
    //         .put(`/blogger/blogs/${result.body.id}`)
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send({
    //           name: 'updated name',
    //           description: 'updated description',
    //           websiteUrl: 'https://vk.ru',
    //         })
    //         .expect(204);

    //       const updatedBlog = await request(app.getHttpServer())
    //         .get(`/blogs/${result.body.id}`)
    //         .expect(200);

    //       expect(updatedBlog.body.name).toBe('updated name');
    //       expect(updatedBlog.body.description).toBe('updated description');
    //       expect(updatedBlog.body.websiteUrl).toBe('https://vk.ru');
    //     });
    //   });

    //   describe('PUT /blogger/blogs/{id} - update blog and update related posts', () => {
    //     const blogToCreate = {
    //       name: 'new blog4',
    //       description: 'desc4',
    //       websiteUrl: 'https://youtube.com',
    //     };

    //     const postToCreate = {
    //       title: 'new post',
    //       shortDescription: 'post ',
    //       content: 'https://email.com',
    //       blogId: null as any,
    //     };

    //     it('Should update posts related to updated blog if blog name was changed', async () => {
    //       const result = await request(app.getHttpServer())
    //         .post('/blogger/blogs')
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(blogToCreate)
    //         .expect(201);

    //       postToCreate.blogId = result.body.id;
    //       const postResult = await request(app.getHttpServer())
    //         .post(`/blogger/blogs/${result.body.id}/posts`)
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(postToCreate)
    //         .expect(201);

    //       expect(postResult.body.blogName).toBe('new blog4');

    //       await request(app.getHttpServer())
    //         .put(`/blogger/blogs/${result.body.id}`)
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send({
    //           name: 'updated name',
    //           description: 'updated description',
    //           websiteUrl: 'https://vk.ru',
    //         })
    //         .expect(204);

    //       const updatedPost = await request(app.getHttpServer())
    //         .get(`/posts/${postResult.body.id}`)
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .expect(200);
    //       expect(updatedPost.body.blogName).toBe('updated name');
    //     });
    //   });

    //   describe('PUT "blogger/blogs/{blogId}/posts/{id}" - update existing post by ID', () => {
    //     it('Should update blog if blog ID is valid', async () => {
    //       const blogToCreate = {
    //         name: 'new blog',
    //         description: 'desc',
    //         websiteUrl: 'https://google.com',
    //       };

    //       const createBlogResponse = await request(app.getHttpServer())
    //         .post('/blogger/blogs')
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(blogToCreate)
    //         .expect(201);
    //       const createdBlog = createBlogResponse.body;

    //       const postToUpdate = {
    //         title: 'new post1',
    //         shortDescription: 'blog with created date field',
    //         content: 'https://email.com',
    //         blogId: `${createdBlog.id}`,
    //       };

    //       const createdPost = await request(app.getHttpServer())
    //         .post(`/blogger/blogs/${createdBlog.id}/posts`)
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(postToUpdate)
    //         .expect(201);

    //       const res = await request(app.getHttpServer())
    //         .put(`/blogger/blogs/${createdBlog.id}/posts/${createdPost.body.id}`)
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send({
    //           title: 'updated new post1',
    //           shortDescription: 'updated desc',
    //           content: 'https://email.net',
    //           blogId: `${createdBlog.id}`,
    //         })
    //         .expect(204);

    //       const updatedPost = await request(app.getHttpServer())
    //         .get(`/posts/${createdPost.body.id}`)
    //         .expect(200);

    //       expect(updatedPost.body.title).toBe('updated new post1');
    //       expect(updatedPost.body.shortDescription).toBe('updated desc');
    //       expect(updatedPost.body.content).toBe('https://email.net');
    //       expect(updatedPost.body.blogId).toBe(`${createdBlog.id}`);
    //     });
    //   });

    //   describe('DELETE blogger/blogs/{id}  - delete blog by id', () => {
    //     const blogToCreate = {
    //       name: 'new blog3',
    //       description: 'desc3',
    //       websiteUrl: 'https://yandex.com',
    //     };

    //     it('Should delete blog by ID', async () => {
    //       const result = await request(app.getHttpServer())
    //         .post('/blogger/blogs')
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .send(blogToCreate)
    //         .expect(201);

    //       const delResult = await request(app.getHttpServer())
    //         .delete(`/blogger/blogs/${result.body.id}`)
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .expect(204);

    //       const response = await request(app.getHttpServer())
    //         .get(`/blogs/${result.body.id}`)
    //         .expect(404);
    //     });

    //     it('Should not delete blog if ID is invalid', async () => {
    //       await request(app.getHttpServer())
    //         .delete('/blogger/blogs/1233')
    //         .set('Authorization', `Bearer ${testUserAccessToken}`)
    //         .expect(404);
    //     });
    //   });
  });
});
