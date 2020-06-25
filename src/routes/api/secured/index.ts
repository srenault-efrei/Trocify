import { Router } from 'express'
import users from './users'
import customers from './customers'
import associations from './associations'
import tickets from './tickets'
import uploadFile from './uploadFile'

const api = Router()

api.use('/tickets', tickets)
api.use('/users', users)
api.use('/customers',customers)
api.use('/associations',associations)
api.use('/uploadFile',uploadFile)

export default api
