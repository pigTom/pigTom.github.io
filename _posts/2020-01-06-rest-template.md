## RestTemplate 

*RestTemplate*是Spring提供给用户使用生成同步客户端http请求的工具

今天遇到了这样一个问题，调用restTemplate#postForObject请求服务数据时，HttpClientErrorException 415 null,网上说是请求头不支持，要加上请求头

``` java
    restTemplate.getInterceptors().add((request, body, execution) -> {
                request.getHeaders().setContentType(MediaType.APPLICATION_JSON);
                request.getHeaders().setAccept(Collections.singletonList(MediaType.ALL));
                return execution.execute(request, body);
    });
```

回来在家试了，可以访问，在公司访问不了，很奇怪。在公司用的如下方法

``` java
  HttpHeaders headers = new HttpHeaders();
            headers.setAccept(Collections.singletonList(MediaType.ALL));
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<?> entity = new HttpEntity<>(dto, headers);
            org.springframework.http.ResponseEntity  response = restTemplate.exchange(url,HttpMethod.POST,  entity, ResponseEntity.class);
          
```

最后不加任何头也可以成功

``` java
 String url = dto.getUrl();
 logger.info("request start: " + new Date());
 ResponseEntity response = restTemplate.postForObject(url,  dto,ResponseEntity.class);
```

![haha](/Users/tangdunhong/Desktop/屏幕快照 2020-01-06 下午8.52.53.png)

这是在同一个ip不同的端口下的测试的，分别是8800, 8802和8804



