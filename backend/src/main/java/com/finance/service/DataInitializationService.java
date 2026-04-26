package com.finance.service;

import com.finance.entity.FinancialRecord;
import com.finance.repository.FinancialRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class DataInitializationService {

    @Autowired
    private FinancialRecordRepository recordRepository;

    private final Random random = new Random();
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final String[] incomeCategories = {"工资收入", "投资收益", "奖金", "兼职收入", "其他收入"};
    private final String[][] incomeSubCategories = {
            {"基本工资", "绩效工资", "补贴"},
            {"股票收益", "基金收益", "理财收益"},
            {"年终奖", "季度奖", "项目奖金"},
            {"副业收入", "临时工作"},
            {"礼金", "红包", "其他"}
    };

    private final String[] expenseCategories = {"餐饮", "交通", "购物", "娱乐", "住房", "医疗", "教育", "其他支出"};
    private final String[][] expenseSubCategories = {
            {"午餐", "晚餐", "早餐", "外卖", "聚餐"},
            {"公交", "地铁", "打车", "加油", "停车费"},
            {"衣服", "鞋子", "化妆品", "电子产品", "日用品"},
            {"电影", "游戏", "旅游", "运动", "会员"},
            {"房租", "水电", "物业费", "装修"},
            {"药品", "体检", "治疗"},
            {"学费", "书籍", "培训"},
            {"礼金", "红包", "罚款", "其他"}
    };

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initData() {
        if (recordRepository.count() > 0) {
            System.out.println("数据已存在，跳过初始化");
            return;
        }

        System.out.println("开始初始化10000条财务数据...");
        List<FinancialRecord> records = generateRecords(10000);
        recordRepository.saveAll(records);
        System.out.println("数据初始化完成，共插入 " + records.size() + " 条记录");
    }

    private List<FinancialRecord> generateRecords(int count) {
        List<FinancialRecord> records = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            boolean isIncome = random.nextDouble() < 0.3;
            
            FinancialRecord record = new FinancialRecord();
            
            if (isIncome) {
                int catIndex = random.nextInt(incomeCategories.length);
                record.setCategory(incomeCategories[catIndex]);
                record.setSubCategory(incomeSubCategories[catIndex][random.nextInt(incomeSubCategories[catIndex].length)]);
                record.setType("收入");
                record.setAmount(generateIncomeAmount());
            } else {
                int catIndex = random.nextInt(expenseCategories.length);
                record.setCategory(expenseCategories[catIndex]);
                record.setSubCategory(expenseSubCategories[catIndex][random.nextInt(expenseSubCategories[catIndex].length)]);
                record.setType("支出");
                record.setAmount(generateExpenseAmount());
            }
            
            record.setTransactionTime(generateRandomTime());
            records.add(record);
        }
        
        return records;
    }

    private BigDecimal generateIncomeAmount() {
        double amount;
        int type = random.nextInt(10);
        
        if (type < 5) {
            amount = 5000 + random.nextDouble() * 15000;
        } else if (type < 8) {
            amount = 1000 + random.nextDouble() * 5000;
        } else {
            amount = 100 + random.nextDouble() * 1000;
        }
        
        return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal generateExpenseAmount() {
        double amount;
        int type = random.nextInt(10);
        
        if (type < 3) {
            amount = 10 + random.nextDouble() * 100;
        } else if (type < 7) {
            amount = 100 + random.nextDouble() * 500;
        } else if (type < 9) {
            amount = 500 + random.nextDouble() * 2000;
        } else {
            amount = 2000 + random.nextDouble() * 5000;
        }
        
        return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);
    }

    private LocalDateTime generateRandomTime() {
        int year = 2024 + random.nextInt(2);
        int month = 1 + random.nextInt(12);
        int day = 1 + random.nextInt(28);
        int hour = 8 + random.nextInt(14);
        int minute = random.nextInt(60);
        int second = random.nextInt(60);
        
        return LocalDateTime.of(year, month, day, hour, minute, second);
    }
}
