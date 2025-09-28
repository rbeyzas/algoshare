import { Arc56Contract } from '@algorandfoundation/algokit-utils-ts'

export const APP_SPEC: Arc56Contract = {
  name: 'MessagingApp',
  structs: {},
  methods: [
    {
      name: 'initialize',
      args: [
        {
          type: 'string',
          name: 'adminAddress',
          desc: 'Admin address who can manage the system',
        },
      ],
      returns: {
        type: 'void',
      },
      actions: {
        create: [],
        call: ['NoOp'],
      },
      readonly: false,
      desc: 'Initialize the messaging application',
      events: [],
      recommendations: {},
    },
    {
      name: 'registerUser',
      args: [
        {
          type: 'string',
          name: 'userAddress',
          desc: 'Address of the user to register',
        },
        {
          type: 'string',
          name: 'publicKey',
          desc: "User's public key for encryption",
        },
      ],
      returns: {
        type: 'void',
      },
      actions: {
        create: [],
        call: ['NoOp'],
      },
      readonly: false,
      desc: 'Register a user for messaging',
      events: [],
      recommendations: {},
    },
    {
      name: 'storeMessageHash',
      args: [
        {
          type: 'string',
          name: 'messageId',
          desc: 'Unique message identifier',
        },
        {
          type: 'string',
          name: 'fromAddress',
          desc: "Sender's address",
        },
        {
          type: 'string',
          name: 'toAddress',
          desc: "Recipient's address",
        },
        {
          type: 'string',
          name: 'messageHash',
          desc: 'SHA-256 hash of the message',
        },
        {
          type: 'string',
          name: 'timestamp',
          desc: 'Message timestamp',
        },
      ],
      returns: {
        type: 'void',
      },
      actions: {
        create: [],
        call: ['NoOp'],
      },
      readonly: false,
      desc: 'Store message hash for verification',
      events: [],
      recommendations: {},
    },
    {
      name: 'verifyMessageHash',
      args: [
        {
          type: 'string',
          name: 'messageId',
          desc: 'Message identifier to verify',
        },
        {
          type: 'string',
          name: 'expectedHash',
          desc: 'Expected hash value',
        },
      ],
      returns: {
        type: 'boolean',
      },
      actions: {
        create: [],
        call: ['NoOp'],
      },
      readonly: true,
      desc: 'Verify message hash',
      events: [],
      recommendations: {},
    },
    {
      name: 'getMessageHistory',
      args: [
        {
          type: 'string',
          name: 'userAddress',
          desc: 'Address of the user',
        },
      ],
      returns: {
        type: 'string',
      },
      actions: {
        create: [],
        call: ['NoOp'],
      },
      readonly: true,
      desc: 'Get message history for a user',
      events: [],
      recommendations: {},
    },
    {
      name: 'getTotalMessages',
      args: [],
      returns: {
        type: 'number',
      },
      actions: {
        create: [],
        call: ['NoOp'],
      },
      readonly: true,
      desc: 'Get total message count',
      events: [],
      recommendations: {},
    },
    {
      name: 'getRegisteredUsers',
      args: [],
      returns: {
        type: 'string',
      },
      actions: {
        create: [],
        call: ['NoOp'],
      },
      readonly: true,
      desc: 'Get registered users',
      events: [],
      recommendations: {},
    },
    {
      name: 'addContact',
      args: [
        {
          type: 'string',
          name: 'userAddress',
          desc: 'Address of the user',
        },
        {
          type: 'string',
          name: 'contactAddress',
          desc: 'Address of the contact to add',
        },
        {
          type: 'string',
          name: 'contactName',
          desc: 'Name of the contact',
        },
      ],
      returns: {
        type: 'void',
      },
      actions: {
        create: [],
        call: ['NoOp'],
      },
      readonly: false,
      desc: 'Add contact for a user',
      events: [],
      recommendations: {},
    },
    {
      name: 'getContacts',
      args: [
        {
          type: 'string',
          name: 'userAddress',
          desc: 'Address of the user',
        },
      ],
      returns: {
        type: 'string',
      },
      actions: {
        create: [],
        call: ['NoOp'],
      },
      readonly: true,
      desc: 'Get contacts for a user',
      events: [],
      recommendations: {},
    },
    {
      name: 'removeContact',
      args: [
        {
          type: 'string',
          name: 'userAddress',
          desc: 'Address of the user',
        },
        {
          type: 'string',
          name: 'contactAddress',
          desc: 'Address of the contact to remove',
        },
      ],
      returns: {
        type: 'void',
      },
      actions: {
        create: [],
        call: ['NoOp'],
      },
      readonly: false,
      desc: 'Remove contact for a user',
      events: [],
      recommendations: {},
    },
    {
      name: 'getMessageStats',
      args: [
        {
          type: 'string',
          name: 'userAddress',
          desc: 'Address of the user',
        },
      ],
      returns: {
        type: 'string',
      },
      actions: {
        create: [],
        call: ['NoOp'],
      },
      readonly: true,
      desc: 'Get message statistics',
      events: [],
      recommendations: {},
    },
  ],
}
