const fs = require('fs');
const path = require('path');

// data.json 파일 읽기
const dataPath = path.join(__dirname, 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 모든 직원 데이터에 isDepartmentHead 필드 추가
Object.keys(data.employees).forEach(empId => {
  if (!data.employees[empId].hasOwnProperty('isDepartmentHead')) {
    data.employees[empId].isDepartmentHead = false;
  }
});

// 파일에 저장
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('✅ 모든 직원 데이터에 isDepartmentHead 필드 추가 완료');
