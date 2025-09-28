import { Contract } from '@algorandfoundation/algokit-utils-ts'

export class MessagingApp extends Contract {
  name = 'MessagingApp'

  // Global state keys
  static readonly TOTAL_MESSAGES = 'total_messages'
  static readonly MESSAGE_HASHES = 'message_hashes'
  static readonly USER_REGISTRATIONS = 'user_registrations'

  // Local state keys
  static readonly USER_CONTACTS = 'user_contacts'
  static readonly USER_MESSAGES = 'user_messages'

  initialize(adminAddress: string): void {
    // Only creator can initialize
    assert(this.txn.sender === this.app.address.creator, 'Only creator can initialize')

    // Set admin
    this.app.global.put('admin', adminAddress)

    // Initialize counters
    this.app.global.put(MessagingApp.TOTAL_MESSAGES, 0)
    this.app.global.put(MessagingApp.MESSAGE_HASHES, '')
    this.app.global.put(MessagingApp.USER_REGISTRATIONS, '')
  }

  registerUser(userAddress: string, publicKey: string): void {
    // Only admin can register users
    assert(this.txn.sender === this.app.global.get('admin'), 'Only admin can register users')
    assert(userAddress.length === 58, 'Invalid Algorand address format')

    // Store user registration
    const userData = `${userAddress}:${publicKey}`
    const registrations = this.app.global.get(MessagingApp.USER_REGISTRATIONS)

    if (registrations === '') {
      this.app.global.put(MessagingApp.USER_REGISTRATIONS, userData)
    } else {
      this.app.global.put(MessagingApp.USER_REGISTRATIONS, `${registrations},${userData}`)
    }
  }

  storeMessageHash(
    messageId: string,
    fromAddress: string,
    toAddress: string,
    messageHash: string,
    timestamp: string,
  ): void {
    // Check if both users are registered
    const registrations = this.app.global.get(MessagingApp.USER_REGISTRATIONS)
    assert(this.isUserRegistered(fromAddress, registrations), 'Sender not registered')
    assert(this.isUserRegistered(toAddress, registrations), 'Recipient not registered')

    // Store message hash
    const messageRecord = `${messageId}:${fromAddress}:${toAddress}:${messageHash}:${timestamp}`
    const existingHashes = this.app.global.get(MessagingApp.MESSAGE_HASHES)

    if (existingHashes === '') {
      this.app.global.put(MessagingApp.MESSAGE_HASHES, messageRecord)
    } else {
      this.app.global.put(MessagingApp.MESSAGE_HASHES, `${existingHashes},${messageRecord}`)
    }

    // Increment total messages
    const totalMessages = this.app.global.get(MessagingApp.TOTAL_MESSAGES)
    this.app.global.put(MessagingApp.TOTAL_MESSAGES, totalMessages + 1)
  }

  verifyMessageHash(messageId: string, expectedHash: string): boolean {
    const messageHashes = this.app.global.get(MessagingApp.MESSAGE_HASHES)

    if (messageHashes === '') {
      return false
    }

    const messages = messageHashes.split(',')
    for (const msg of messages) {
      const parts = msg.split(':')
      if (parts.length >= 4 && parts[0] === messageId) {
        return parts[3] === expectedHash
      }
    }

    return false
  }

  getMessageHistory(userAddress: string): string {
    const userMessages = this.app.local.get(userAddress, MessagingApp.USER_MESSAGES)

    if (userMessages === '') {
      return '[]'
    }

    return userMessages.split(',').filter((msg: string) => msg !== '')
  }

  getTotalMessages(): number {
    return this.app.global.get(MessagingApp.TOTAL_MESSAGES)
  }

  getRegisteredUsers(): string {
    const registrations = this.app.global.get(MessagingApp.USER_REGISTRATIONS)

    if (registrations === '') {
      return '[]'
    }

    return registrations.split(',').map((reg: string) => reg.split(':')[0])
  }

  addContact(userAddress: string, contactAddress: string, contactName: string): void {
    // Only user can add their own contacts
    assert(this.txn.sender === userAddress, 'Only user can add their own contacts')

    // Store contact
    const contactData = `${contactAddress}:${contactName}`
    const existingContacts = this.app.local.get(userAddress, MessagingApp.USER_CONTACTS)

    if (existingContacts === '') {
      this.app.local.put(userAddress, MessagingApp.USER_CONTACTS, contactData)
    } else {
      this.app.local.put(userAddress, MessagingApp.USER_CONTACTS, `${existingContacts},${contactData}`)
    }
  }

  getContacts(userAddress: string): string {
    const contacts = this.app.local.get(userAddress, MessagingApp.USER_CONTACTS)

    if (contacts === '') {
      return '[]'
    }

    return contacts.split(',').filter((contact: string) => contact !== '')
  }

  removeContact(userAddress: string, contactAddress: string): void {
    // Only user can remove their own contacts
    assert(this.txn.sender === userAddress, 'Only user can remove their own contacts')

    const existingContacts = this.app.local.get(userAddress, MessagingApp.USER_CONTACTS)

    if (existingContacts !== '') {
      const contacts = existingContacts.split(',').filter((contact: string) => {
        const parts = contact.split(':')
        return parts.length > 0 && parts[0] !== contactAddress
      })

      this.app.local.put(userAddress, MessagingApp.USER_CONTACTS, contacts.join(','))
    }
  }

  getMessageStats(userAddress: string): string {
    const userMessages = this.app.local.get(userAddress, MessagingApp.USER_MESSAGES)

    if (userMessages === '') {
      return '0'
    }

    const messages = userMessages.split(',').filter((msg: string) => msg !== '')
    return messages.length.toString()
  }

  // Helper function to check if user is registered
  private isUserRegistered(userAddress: string, registrations: string): boolean {
    if (registrations === '') {
      return false
    }

    const users = registrations.split(',')
    for (const user of users) {
      const parts = user.split(':')
      if (parts.length > 0 && parts[0] === userAddress) {
        return true
      }
    }

    return false
  }

  // Helper function to store user message locally
  storeUserMessage(userAddress: string, messageRecord: string): void {
    const existingMessages = this.app.local.get(userAddress, MessagingApp.USER_MESSAGES)

    if (existingMessages === '') {
      this.app.local.put(userAddress, MessagingApp.USER_MESSAGES, messageRecord)
    } else {
      this.app.local.put(userAddress, MessagingApp.USER_MESSAGES, `${existingMessages},${messageRecord}`)
    }
  }
}
