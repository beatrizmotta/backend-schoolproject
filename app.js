const express = require('express')
const mongoose = require('mongoose')
const app = express()
const bcrypt = require('bcrypt')
const saltRounds = 10
const cors = require('cors')
const session = require('express-session')

const {Student, Teacher, Classe, Admin} = require('./dbSchema')

async function main() {
    await mongoose.connect('mongodb://localhost:27017/escolamovimento')
}

main()
    .then(console.log('Conectado ao banco de dados com sucesso!'))
    .catch((erro) => console.log(`Erro na conexão: ${erro}`))

const PORT = 9091

app.use(session({
    key: 'userId',
    secret: ['ae03lfjru-dmepf'],
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 60 * 24 * 30 * 12 * 90
    }
}))

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
}))

//Sign Ups
    app.post('/professor/signup', (req, res) => {
        bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
            if (err) {
                res.json({erro: err})
            }
            const newProfessor = new Teacher({
                name: req.body.name,
                email: req.body.email,
                professorId: req.body.professorId,
                password: hash
            })
            newProfessor.save()
                .then(() => {
                    console.log('Sucesso!')
                    res.json({msg: 'Usuário cadastrado'})
                })
                .catch((err) => {
                    console.log(`Erro: ${err}`)
                    res.json({msg: err})
                })
        })
    })
    app.post('/student/signup', (req, res) => {
        bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
            if (err) {
                res.json({erro: err})
            }
            const newStudent = new Student({
                name: req.body.name,
                email: req.body.email,
                password: hash
            })
            newStudent.save()
                .then(() => {
                    console.log('Sucesso!')
                    res.json({msg: 'Usuário cadastrado'})
                })
                .catch((err) => {
                    console.log(`Erro: ${err}`)
                    if (err.code === 11000) {
                        res.json({msg: 'Já existe um usuário!'})
                    }
                })
        })
    })

//Log Ins
    app.post('/login', (req, res) => {
        const password = req.body.password
        const email = req.body.email
        console.log(req.body)
        Student.findOne({'email': email}, (err, user) => {
            if (!user) {
                Teacher.findOne({'email': email}, (err, user) => {
                    if (!user) {
                        res.send({loggedIn: false, msg: 'Usuário não cadastrado.', code: 401})
                    } else if (user) {
                        bcrypt.compare(password, user.password, (fail, response) => {
                            if (response) {
                                req.session.user = user
                                res.send({loggedIn: true, user: user})
                            } else {
                                res.send({loggedIn: false, msg: 'Senha está errada.', code: 400})
                            }
                        })
                    }
                })
            } else if (user) {
                bcrypt.compare(password, user.password, (fail, response) => {
                    if (response) {
                        req.session.user = user
                        res.send({loggedIn: true, user: user})
                    } else if (fail) {
                        res.send({loggedIn: false, msg: 'Senha está errada', code: 400})
                    }
                })
            }
        })
    })
    app.post('/21232f297a57a5a743894a0e4a801fc3-adm', (req, res) => {
        const rg = req.body.rg
        const password = req.body.password
        Admin.findOne({'rg': rg}, (err, admin) => {
            if (admin) {
                if (password === admin.password) {
                    req.session.user = admin
                    res.send({status: 'OK', adminLogged: true, user_data: admin})
                } else {
                    res.send({status: 'NOT OK', adminLogged: false})
                }
            }
        })
    })
    
//Log Ins Checkups
    app.get('/login', (req, res) => {
        if (req.session.user) {
            res.send({loggedIn: true, user: req.session.user})
        } else {
            res.send({loggedIn: false})
        }
    })

    let admin_credentials
    Admin.findOne({}, (err, admin) => {
        if (admin) {
            admin_credentials = admin
        } else {
            console.log(err)
        }
    })

    const checkIfAdmin = (req, admin) => {
        if ((req.session.user["rg"]) && (req.session.user["rg"] === admin.rg) && (req.session.user["password"] === admin.password)) {
            return true 
        } else {
            return false 
        }
    }
    app.get('/admin', (req, res) => {
        if (checkIfAdmin(req, admin_credentials)) {
            res.send({adminIn: true})
        } else {
            res.send({adminIn: false})
        }
    })

// Get Requests
    app.get('/professores', (req, res) => {
        if (req.session.user["rg"]) {
            Teacher.find({}, (err, professores) => {
                res.send({professores: professores})
            })
        } else {
            res.send({msg: 'Not authorized'})
        }
    })

    app.get('/alunos', (req, res) => {
        if (req.session.user["rg"]) {
            Student.find({}, (err, alunos) => {
                res.send({alunos: alunos})
            })
        } else {
            res.send({msg: 'Not authorized'})
        }
    })

    app.get('/classes', (req, res) => {
        if (req.session.user["rg"]) {
            Classe.find({}, (err, classes) => {
                res.send({classes: classes})
            })
        } else {
            res.send({msg: 'Not authorized'})
        }
    })
    //Delete and Update







app.listen(PORT, () => {
    console.log(`Server running.\nhttp://localhost:${PORT}`)
})