# The initial project explained

## Introduction

In this article we'll explain the conversation contained in the default project.

## Code generators 

Yaktor provides a set of code generators.
We'll focus on a subset here. 

### gen-src

The first code generator we'll look at is the `gen-src`. 

The `gen-src` command reads the yaktor langauges files and generate source code from them.

If you run Yaktor using the Docker image, the command is:

```
$ yak gen-src
```

If you decided to go the **hard** route when installing Yaktor, you may have all the node.js and grunt tools installed and may run the command as:

```
$ grunt gen-src
```

A set of artifacts are being produced by this command. 
We'll discuss these in a different article. For now, we'll just say that this command generate:

- The node.js code required to execute the agent behaviors
- Visualization of the language files

Because we'll only explain the demo file in this article, we'll focus on what is generated from the `cl` files (or conversation language files).

### gen-views

The `gen-views` command is used to generate user interfaces.
Itcan be run as:

```
$ yak gen-views
```

or drop the `yak` if you are running outside docker.

## start

You can start the server after having completed the code generation commands as follows:

```
$ yak start
```

## Study the `cl` file

Use your favorite editor to open the `demo.cl` file. 

You should see a complete listing looking something like this:

```
/*
 * This is a simple demo of Yaktor.
 * The demo describes two simple agents:
 *
 * - Switch. Represents a simple switch that when receiving a command to 'flip' turns itself on or off
 * - Outlet. Represents some outlet controlled by the switch
 */ 
conversation demo {

  /*
   * The Circuit is what we call a `conversation type`. 
   * The idea is that there actors collaborate over the same instance of a conversation object (here an instance of a Circuit).
   */
  type Circuit {
    String name!
  }

  /*
   * A simple switch agent
   */
  infinite agent Switch concerning Circuit {
    privately receives flip
    sends turnOn
    sends turnOff

    initially becomes off {
      on {
        flip -> off > turnOff
      }
      off {
        flip -> on > turnOn
      }
    }
  }

  /*
   * A simple outlet
   */
  infinite agent Outlet concerning Circuit {

    initially becomes off {
      off {
        Switch.turnOn -> current
      }
      current {
        Switch.turnOff -> off
      }
    }
  }

}
```

The file above defines what we call a conversation. 
The conversation is the outer definition in the file.

```
conversation demo {
// content goes here
}
```

You may also note that the conversation language allows two kinds of comments:

```
/* c-style comment */
// comment to the end of the line
```

The conversation defines a collaboration between two agents, Switch and Outlet. 
f
Lets start by studying the agent Switch. 
Agents are defined with the keyword `agent'.

In our example:

```
infinite agent Switch {
  // definition of the agent
}
```

The `infinite` qualifier in front of the `agent` keyword, means that this agent doesn't have an end state. 
In other words, when we create the agent, we expect it to live forever.

The Switch agent has two states:

- on
- off

We define that in the agent as follows:

```
initially becomes off {
  off {}
  on {}
}
```

The statement `initially becomes off` states that the agent will be off when first created (usually called initial state).

The Switch agent changes state on the event flip `flipped`. 

Which events the agent produces and consumes are typically defined in the body of the agent. 
The agent Switch defines the following events:

```
privately recieves flip
sends turnOn
sends turnOf
```

`privately receives` simply means that the agent (or its external agent) will internally produce and consume the event.
This makes sens for `flip` as the switch does not expect to recieve this event from another agent.
We could for instance imagine that we'll build a cellphone app with a big button stating `flip`. 
This cellphone app would act as an extenral agent to for the agent Switch.

`sends` means that the agent produce an event that it or other agents reacts to. 
The switch sends two events, `turnON` and `turnOff`. 

The next thing to look at is the definitio of a state. Let's look at the definition of the state `on`.

```
on {
  flip -> off > turnOff
}
```

We are using a shorthand notation here. Another way to write the same thing would be:

```
on {
        receives flip becomes off sends turnOff
}
```

In other words, what we're saying is `if an instance of the agent Switch is in the state on and it receives the event flip, it changes state to off and sends the event turnOff.

So, let's look at the complete agent definition again:

```
infinite agent Switch concerning Circuit {
  privately receives flip
  sends turnOn
  sends turnOff

  initially becomes off {
    on {
      flip -> off > turnOff
    }
    off {
      flip -> on > turnOn
    }
  }
}
```

A natural language description of the agent `Switch` would go something like this:

  A Switch is an agent that collaborates with other agents on an instnace of a circuit. 
  When created, it start in the state off.
  The Switch reacts to the event flip and produces the events turnOn and turnOff.
  If the Switch recives the flip event when in the state on, it changes state to off and produces the event turnOff.
  If the Switch recives the flip event when in the state off, it changes state to on and produces the event turnOn.

We will not explain all the details of the agent Outlet. 
You should be able to interpret the definition of the Outlet yourself based on the discussion around the Switch.

What is new is that the Outlet reacts to events produced by the switch.
Notice the following definition in the Outlet state:

```
off {
  Switch.turnOn -> current
}
```

This defintion could also have been written as:

```
off {
        receives Switch.turnOn becomes current
}
```

What we are defining is a collaboration between two agents. 
We're saying that, when the Switch produces the event turnOn, we will change our state to `current`.


## Running the sample

Let's see the conversation in action.
If you haven't already done so, we have to run the code generators and start the server.

You can do them all with this command:

```
$ yak gen-src gen-views start
```

When the server comes up, it would display the IP running the application.
In Docker it would typically be something starting with 172.x.x.x.

Next, simply open the browser on the IP with the path `/demo/test.html'.

E.g., say the server printed out a IP of 172.0.20.4, I would then open the browser on:

http://172.0.20.4/demo/test.html

Now you should see a html form with the two agents, Switch and Outlet.

Click on the button `Connect` followed by `Init All`. 

You should now see two state machines, one for each agent. 
You should also be able to click on the button to `stimulate` the Switch agent with the event `flip`. 

If you now see the Outlet change state as a result of `flip`.... we have a working application.

## Customization

### Cassandra 
The simplest and greatest customization you can do is to enable cassandra. There are
already some lines in the docker-compose.yml which you can uncomment referencing cassandra.
You will also need to run:

```bash
yak yaktor cassandra
```
