self.onmessage = function(e) {
  const { type, data } = e.data
  
  if (type === 'process') {
    processData(data)
  }
}

function processData(records) {
  self.postMessage({
    type: 'progress',
    message: `开始处理 ${records.length} 条数据...`
  })

  try {
    const startTime = performance.now()
    
    const months = extractMonths(records)
    const pivotData = buildPivotTable(records, months)
    const summary = calculateSummary(records)
    
    const endTime = performance.now()
    
    self.postMessage({
      type: 'progress',
      message: `数据聚合完成，耗时 ${(endTime - startTime).toFixed(2)}ms`
    })

    self.postMessage({
      type: 'result',
      data: {
        pivotData,
        months,
        summary
      }
    })

  } catch (error) {
    self.postMessage({
      type: 'error',
      message: `数据处理错误: ${error.message}`
    })
  }
}

function extractMonths(records) {
  const monthSet = new Set()
  
  records.forEach(record => {
    const month = getYearMonth(record.transactionTime)
    monthSet.add(month)
  })
  
  return Array.from(monthSet).sort()
}

function getYearMonth(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function buildPivotTable(records, months) {
  const categoryMap = new Map()
  
  records.forEach((record, index) => {
    if (index % 1000 === 0 && index > 0) {
      self.postMessage({
        type: 'progress',
        message: `正在聚合数据... ${((index / records.length) * 100).toFixed(0)}%`
      })
    }
    
    const month = getYearMonth(record.transactionTime)
    const category = record.category || '未分类'
    const subCategory = record.subCategory || '未分类'
    const type = record.type || '支出'
    const amount = parseFloat(record.amount) || 0
    
    const categoryKey = `${type}_${category}`
    
    if (!categoryMap.has(categoryKey)) {
      categoryMap.set(categoryKey, {
        type,
        category,
        subCategories: new Map(),
        monthlyData: initMonthlyData(months)
      })
    }
    
    const categoryData = categoryMap.get(categoryKey)
    const signedAmount = type === '收入' ? amount : -amount
    updateMonthlyData(categoryData.monthlyData, month, amount, signedAmount)
    
    const subCategoryKey = subCategory
    if (!categoryData.subCategories.has(subCategoryKey)) {
      categoryData.subCategories.set(subCategoryKey, {
        subCategory,
        monthlyData: initMonthlyData(months)
      })
    }
    
    const subCategoryData = categoryData.subCategories.get(subCategoryKey)
    updateMonthlyData(subCategoryData.monthlyData, month, amount, signedAmount)
  })
  
  const result = {
    income: [],
    expense: [],
    grandTotal: {
      monthlyData: initMonthlyData(months)
    }
  }
  
  categoryMap.forEach((data, key) => {
    const categoryItem = {
      type: data.type,
      category: data.category,
      monthlyData: data.monthlyData,
      subCategories: []
    }
    
    data.subCategories.forEach((subData, subKey) => {
      categoryItem.subCategories.push({
        subCategory: subData.subCategory,
        monthlyData: subData.monthlyData
      })
    })
    
    Object.keys(data.monthlyData).forEach(month => {
      if (month !== 'total') {
        result.grandTotal.monthlyData[month].income += data.type === '收入' ? data.monthlyData[month].income : 0
        result.grandTotal.monthlyData[month].expense += data.type === '支出' ? data.monthlyData[month].expense : 0
        result.grandTotal.monthlyData[month].net += data.monthlyData[month].net
      }
    })
    result.grandTotal.monthlyData.total.income += data.type === '收入' ? data.monthlyData.total.income : 0
    result.grandTotal.monthlyData.total.expense += data.type === '支出' ? data.monthlyData.total.expense : 0
    result.grandTotal.monthlyData.total.net += data.monthlyData.total.net
    
    if (data.type === '收入') {
      result.income.push(categoryItem)
    } else {
      result.expense.push(categoryItem)
    }
  })
  
  result.income.sort((a, b) => b.monthlyData.total.net - a.monthlyData.total.net)
  result.expense.sort((a, b) => b.monthlyData.total.net - a.monthlyData.total.net)
  
  return result
}

function initMonthlyData(months) {
  const data = {
    total: {
      income: 0,
      expense: 0,
      net: 0,
      count: 0
    }
  }
  
  months.forEach(month => {
    data[month] = {
      income: 0,
      expense: 0,
      net: 0,
      count: 0
    }
  })
  
  return data
}

function updateMonthlyData(monthlyData, month, amount, signedAmount) {
  if (monthlyData[month]) {
    if (signedAmount >= 0) {
      monthlyData[month].income += amount
    } else {
      monthlyData[month].expense += amount
    }
    monthlyData[month].net += signedAmount
    monthlyData[month].count += 1
  }
  
  if (signedAmount >= 0) {
    monthlyData.total.income += amount
  } else {
    monthlyData.total.expense += amount
  }
  monthlyData.total.net += signedAmount
  monthlyData.total.count += 1
}

function calculateSummary(records) {
  let totalIncome = 0
  let totalExpense = 0
  
  records.forEach(record => {
    const amount = parseFloat(record.amount) || 0
    if (record.type === '收入') {
      totalIncome += amount
    } else {
      totalExpense += amount
    }
  })
  
  return {
    totalCount: records.length,
    totalIncome: roundToTwo(totalIncome),
    totalExpense: roundToTwo(totalExpense),
    netBalance: roundToTwo(totalIncome - totalExpense)
  }
}

function roundToTwo(num) {
  return Math.round(num * 100) / 100
}
