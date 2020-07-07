const { gql, PubSub } = require("apollo-server");

const pubsub = new PubSub();

const store = {
  messages: [],
  todos: [
    { id: 0, text: "Go to the shop", complete: false },
    { id: 1, text: "Go to school", complete: true },
    { id: 2, text: "Use urql", complete: false },
    { id: 3, text: "Add relayPagination", complete: false },
    { id: 4, text: "Put your left foot in", complete: false },
    { id: 5, text: "Put your left foot out", complete: false },
    { id: 6, text: "Put your right foot in", complete: false },
    { id: 7, text: "Shake it all about", complete: false },
    { id: 8, text: "Do the Hokey Pokey", complete: false },
    { id: 9, text: "Turn yourself around", complete: false },
    { id: 10, text: "Ponder if that's really what it's all about.", complete: false },
  ],
};

exports.typeDefs = gql`
  type Query {
    todos(first: Int, after: String): TodosConnection
    messages(first: Int, after: String): MessagesConnection
  }

  type Mutation {
    toggleTodo(id: ID!): Todo
  }

  type Todo {
    id: ID
    text: String
    complete: Boolean
  }

  type Subscription {
    newMessages: Message
  }

  type Message {
    id: ID
    from: String
    message: String
  }

  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
  }

  type TodoEdge {
    node: Todo
    cursor: String
  }

  type MessageEdge {
    node: Message
    cursor: String
  }

  type TodosConnection {
    totalCount: Int!
    pageInfo: PageInfo!
    nodes: [Todo!]!
    edges: [TodoEdge!]!
  }

  type MessagesConnection {
    totalCount: Int!
    pageInfo: PageInfo!
    nodes: [Message!]!
    edges: [MessageEdge!]!
  }
`;

function connectionize(list, { first = null, after = 0 }) {
  const beg = Number(after);
  const end = first !== null ? beg + first : Infinity;
  const totalCount = list.length;
  const nodes = list.slice(beg, end);
  // console.log(first, after, beg, end);
  return {
    totalCount,
    pageInfo: {
      hasNextPage: end < totalCount,
      endCursor: end >= totalCount ? totalCount : end,
    },
    nodes,
    edges: nodes.map((node) => ({ node, cursor: String(node.id) })),
  };
}

exports.resolvers = {
  Query: {
    todos: (_r, { first, after }) => connectionize(store.todos, { first, after }),
    messages: (_r, { after, first }) => connectionize(store.messages, { first, after }),
  },
  Mutation: {
    toggleTodo: (root, { id }, context) => {
      store.todos[id].complete = !store.todos[id].complete;
      return store.todos[id];
    },
  },
  Subscription: {
    newMessages: {
      subscribe: () => pubsub.asyncIterator("newMessages"),
    },
  },
};

// Fake message dispatcher
let number = 0;

setInterval(() => {
  const newMessage = {
    id: ++number,
    message: `This is message number ${number}`,
    from: "Server",
  };
  store.messages.push(newMessage);
  pubsub.publish("newMessages", {
    newMessages: newMessage,
  });
}, 3000);

setInterval(() => {
  store.messages = [];
}, 20000);
