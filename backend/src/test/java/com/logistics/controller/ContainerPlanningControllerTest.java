package com.logistics.controller;

import com.logistics.model.Cargo;
import com.logistics.model.Container;
import com.logistics.model.ContainerPlanningResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
class ContainerPlanningControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testGetPlanningData() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/planning-data"))
                .andExpect(status().isOk())
                .andReturn();

        String content = result.getResponse().getContentAsString();
        
        assertTrue(content.contains("container"));
        assertTrue(content.contains("cargoList"));
        assertTrue(content.contains("length"));
        assertTrue(content.contains("width"));
        assertTrue(content.contains("height"));
    }
}
