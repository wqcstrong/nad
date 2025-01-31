package cn.lalaframework.nad.controllers;

import cn.lalaframework.nad.controllers.dto.Role;
import cn.lalaframework.nad.controllers.dto.User;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;

@RestController
public class MyController {
    @RequestMapping(method = RequestMethod.GET, value = "/getUser")
    User getUser(@RequestParam String name, @RequestParam("type") String userType) {
        return new User();
    }

    @GetMapping("/users")
    List<User> getUserList() {
        return Collections.singletonList(new User());
    }

    @PostMapping(value = "/setRole", headers = {"id=5"})
    Long setRole(@RequestParam Role type) {
        return System.currentTimeMillis();
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Long upload(MultipartFile file) {
        if (file == null) return 0L;
        return System.currentTimeMillis();
    }

    @GetMapping(value = "/ui", produces = MediaType.TEXT_HTML_VALUE)
    String ui() {
        return String.format("<h1>Hello World at %d</h1>", System.currentTimeMillis());
    }
}
