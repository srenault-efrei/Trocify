import { Router, Request, Response } from 'express'
import { isEmpty } from 'lodash'
import { error, success } from '../../core/helpers/response'
import { BAD_REQUEST, CREATED, OK } from '../../core/constants/api'
import jwt from 'jsonwebtoken'

import passport from 'passport'
import Customer from '@/core/models/Customer'
import Association from '@/core/models/Association'
import Rank from '@/core/models/Rank'

const api = Router()

api.post('/signup/customers', async (req: Request, res: Response) => {
  const fields = ['firstname', 'lastname', 'longitude','latitude', 'email', 'password', 'passwordConfirmation']

  try {
    const missings = fields.filter((field: string) => !req.body[field])

    if (!isEmpty(missings)) {
      const isPlural = missings.length > 1
      throw new Error(`Field${isPlural ? 's' : ''} [ ${missings.join(', ')} ] ${isPlural ? 'are' : 'is'} missing`)
    }
    const { firstname, lastname, email, gender, password, passwordConfirmation,longitude,latitude} = req.body
    if (password !== passwordConfirmation) {
      throw new Error("Password doesn't match")
    }

    const customer = new Customer()
    let rank = await Rank.findOne(1)

    customer.firstname = firstname,
    customer.lastname = lastname,
    customer.email = email,
    customer.gender = gender
    customer.password = password
    customer.longitude= longitude
    customer.latitude= latitude
    customer.totalTickets=0

    customer.rank = rank

    await customer.save()

    const payload = { id: customer.id, firstname }
    const token = jwt.sign(payload, process.env.JWT_ENCRYPTION as string)

    res.status(CREATED.status).json(success(customer, { token }))
  } catch (err) {
    res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, err))
  }
})

api.post('/signup/associations', async (req: Request, res: Response) => {
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




api.post('/signin', async (req: Request, res: Response) => {
  const authenticate = passport.authenticate('local', { session: false }, (errorMessage, user) => {
    if (errorMessage) {
      res.status(BAD_REQUEST.status).json(error(BAD_REQUEST, new Error(errorMessage)))
      return
    }

    const payload = { id: user.id, firstname: user.firstname }
    const token = jwt.sign(payload, process.env.JWT_ENCRYPTION as string)

    res.status(OK.status).json(success(user, { token }))
  })

  authenticate(req, res)
})

export default api
