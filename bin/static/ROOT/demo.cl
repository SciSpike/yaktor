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
