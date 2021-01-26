import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  AfterLoad,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'
import { IsEmail, IsNotEmpty } from 'class-validator'
import { BooleanLiteral } from 'typescript'

import { password } from '../../utilities/random'

class UserJson {
  isActive: BooleanLiteral
  resetPasswordToken: string
  resetPasswordTokenExp: number
  emailConfirmationToken: string
  emailConfirmationTokenExp: number
  emailConfirmed: boolean

  name: string
  email: string
};

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  @IsEmail()
  email: string

  @Column()
  @IsNotEmpty()
  password: string

  @Column({ default: false })
  isAdmin: boolean

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  created!: Date

  @UpdateDateColumn()
  updated!: Date

  @Column({ default: '' })
  emailConfirmationToken: string

  @Column({ default: '' })
  resetPasswordToken: string

  @Column('json')
  data: UserJson

  constructor () {
    this.data = new UserJson()
    this.emailConfirmationToken = ''
    this.resetPasswordToken = ''
  }

  /**
   * Set values in this.data from values in json
   */
  @AfterLoad()
  public setValuesFromJson (): any {
    // json parsing is done automatically
    const data = this.data ?? {}
    for (const key in data) {
      if (!(key in this)) {
        this[key] = data[key]
      }
    }
  }

  /**
   * Add values in `this.data` object starting from
   * values in `this`. The idea is that it is possible
   * to assign any value to a UserEntity and then this
   * function will reconstruct the UserJson object and
   * assign to `this.data`. This allows to hide db
   * internal details.
   */
  public async setJsonFromValues (): Promise<any> {
    const data = new UserJson()
    Object.keys(data).forEach(key => {
      if (key in this) {
        const castedKey: string = key
        data[castedKey] = this[key]
      }
    })
    this.data = data
  }

  /**
   * Set token for password reset
   */
  async setResetPasswordToken (): Promise<any> {
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 1)

    this.data.resetPasswordTokenExp = expirationDate.getTime()
    this.data.resetPasswordToken = password(10)
    this.resetPasswordToken = this.data.resetPasswordToken
  }

  /**
   * Set token for confirmation email
   */
  async setConfirmationEmailToken (): Promise<any> {
    // TODO: fix hard coded values;
    this.data.emailConfirmationToken = password(6)

    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 1)
    this.data.emailConfirmationTokenExp = expirationDate.getTime()

    this.data.emailConfirmed = false

    // This is needed for searching. Maybe it can be improved?
    this.emailConfirmationToken = this.data.emailConfirmationToken
  }
}
