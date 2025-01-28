const express = require('express');
const mysql = require('mysql');

const db = mysql.createPool({
    host: '43.156.50.38', // 数据库主机地址
    user: 'smallcrab', // 数据库用户名
    password: 'Zy123654', // 数据库密码
    database: 'doso', // 数据库名称
});

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs'); // 设置视图引擎为ejs
// app.set('views', './views'); // 设置视图文件夹位置

app.get('/', (req, res) => {
    // 获取当前年月
    const today = new Date();
    const year = today.getFullYear();
    let sYear = year;
    const month = today.getMonth() + 1;
    let sMonth = month;
    if (month === 1) {
        sYear = year - 2;
        sMonth = 12
    } else {
        sYear = year - 1;
        sMonth = month - 1;
    }

    const sqlTx = 'SELECT * FROM doso.transaction WHERE YEAR(tx_time) = ? AND MONTH(tx_time) = ?';
    const sqlOperating = 'SELECT SUM(staff_salary) + SUM(rent) + SUM(other_cost) AS total_amount FROM doso.operating_cost'
    const sqlAmount = 'SELECT SUM(tx_amount) as amount FROM doso.transaction WHERE YEAR(tx_time) > ? OR (YEAR(tx_time) = ? AND MONTH(tx_time) >= ?)'

    Promise.all([
        new Promise((resolve, reject) => {
            db.query(sqlTx, [sYear, sMonth], (err, results) => {
                if (err) {
                    reject(err)
                }
                resolve(results)
            })
        }),
        new Promise((resolve, reject) => {
            db.query(sqlOperating, (err, results) => {
                if (err) {
                    reject(err)
                }
                resolve(results)
            })
        }),
        new Promise((resolve, reject) => {
            db.query(sqlAmount, [sYear, sYear, sMonth], (err, results) => {
                if (err) {
                    reject(err)
                }
                resolve(results)
            })
        }),
        new Promise((resolve, reject) => {
            db.query(sqlAmount, [2024, 2024, 10], (err, results) => {
                if (err) {
                    reject(err)
                }
                resolve(results)
            })
        }),
        new Promise((resolve, reject) => {
            db.query(sqlTx, [year, month], (err, results) => {
                if (err) {
                    reject(err)
                }
                resolve(results)
            })
        })
    ]).then(([results1, results2, results3, results4, results5]) => {
        const cMonthReceive = results5[0].tx_amount;
        const b202410Amount = results3[0].amount - results4[0].amount;
        const a202410Amount = results4[0].amount;
        const b202410Rent = b202410Amount * 0.02;
        const a202410Rent = (a202410Amount - cMonthReceive) * 0.02625;
        const operateAmount = results2[0].total_amount;
        const cTotalAmount = b202410Rent + a202410Rent + operateAmount + results1[0].tx_amount;
        const cMonthIncome = cTotalAmount / 0.65;
        let data = {
            timestamp: year + '年' + month + '月',
            totalAmount: results3[0].amount,
            currentMonthReceive: cMonthReceive,
            totalBefore202410Amount: b202410Amount,
            totalAfter202410Amount: a202410Amount,
            currentTotalAmount: cTotalAmount,
            currentRefund: results1[0].tx_amount,
            currentMonthRent: b202410Rent + a202410Rent,
            currentMonthIncome: cMonthIncome,
            currentIncomeAgain: cMonthIncome - cMonthReceive > 0 ? cMonthIncome - cMonthReceive : '已经完成任务',
            operatingAmount: operateAmount,
        }
        // res.send(data)
        res.render('index', data)
    }).catch(err => {
        return res.status(500).send(err.message)
    })
})

app.listen(port, () => {
    console.log('listening...')
})
