import { Router, Request, Response } from 'express'
import { isEmpty } from 'lodash'
import bcrypt from 'bcryptjs'
import { error, success } from '../../../core/helpers/response'
import { BAD_REQUEST, CREATED, OK } from '../../../core/constants/api'
import jwt from 'jsonwebtoken'
import Association from '@/core/models/Association'
import User from '@/core/models/User'
import uploadFile from '@/core/services/amazonS3'


const api = Router()


api.post('/', async (req: Request, res: Response) => {
  const fields = ['name','filePath','description','email', 'password', 'passwordConfirmation','longitude','latitude']
  try {
    const missings = fields.filter((field: string) => !req.body[field])

    if (!isEmpty(missings)) {
      const isPlural = missings.length > 1
      throw new Error(`Field${isPlural ? 's' : ''} [ ${missings.join(', ')} ] ${isPlural ? 'are' : 'is'} missing`)
    }

    const { name,filePath, email,description,password, passwordConfirmation,longitiude,latitude } = req.body

    if (password !== passwordConfirmation) {
      throw new Error("Password doesn't match")
    }
    const association : Association = new Association()
    association.name = name,
    association.filePath = filePath,
    association.email = email,
    association.description = description
    association.password = password
    association.longitude = longitiude
    association.latitude = latitude
    await association.save()
    const payload = { id: association.id, name }
    const token = jwt.sign(payload, process.env.JWT_ENCRYPTION as string)

    res.status(CREATED.status).json(success(association, { token }))
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})


api.put('/:id', async (req: Request, res: Response) => {

  const fields = ['name','filePath','description','email']
  try {
    const { id } = req.params
    const missings = fields.filter((field: string) => !req.body[field])

    if (!isEmpty(missings)) {
      const isPlural = missings.length > 1
      throw new Error(`Field${isPlural ? 's' : ''} [ ${missings.join(', ')} ] ${isPlural ? 'are' : 'is'} missing`)
    }
    const {name,filePath, email,description } = req.body
    const association = await Association.findOne(id)
    if (association){
      if(req.body.password){
        association.password= bcrypt.hashSync(req.body.password, User.SALT_ROUND)
      }
      if(req.body.filename && req.body.key){
        uploadFile(req.body.filename, req.body.key)
        association.avatarFile= `https://trocifyfile.s3.eu-west-3.amazonaws.com/${req.body.key}`
      }
     
      association.name = name,
      association.filePath = filePath,
      association.email = email,
      association.description = description
      await association.save()
      res.status(OK.status).json(success(association))
    }
    else {
      res.status(BAD_REQUEST.status).json( {'err':'association inexistante'})
    }
  
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})

api.get('/', async (req: Request, res: Response) => {
  try {
    const assos = await Association.find()
    res.status(CREATED.status).json(success(assos))
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})

api.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const asso = await Association.findOne(id)
    res.status(CREATED.status).json(success(asso))
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})

export default api
