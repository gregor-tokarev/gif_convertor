# Gif Converter
![demo usage](assets/gif_convertor_example.gif)

### Deployment
- Run `docker compose up -d`
- Open `http://localhost:9090` (MinIO admin panel)
- Credentials:
  - username: `minio`
  - password: `minio123`
- Go to the `uploads` bucket  
![img_2.png](assets/img_2.png)  
- Open the settings  
![img_3.png](assets/img_3.png)  
- Frontend is available at `http://localhost:4200`  

---

### Performance
Load testing methodology:
- Test was run on MacBook Air M1 with 8GB RAM
- A test video `apps/loadtests/assets/test_to-gif.mp4` was created (1024x768, 10s)
- Using `k6`, a 60-second load test with 10 concurrent threads was executed
- After one minute, the number of converted GIF files stored in MinIO was counted
- In one minute, 5 workers converted **118 GIF files**  

![run k6 load test](assets/img_1.png)  
![test_results](assets/img.png)  

---

### Security Issue
There is one issue regarding the public access to the bucket.  
In theory, someone could brute-force file names and access other users’ uploads.  

I left it as is because I had already spent enough time on the project.  

*How I would fix it:*  
- Create anonymous registration for users  
- Store the owner of each file in the database  
- Serve files through a route that checks authorization  
