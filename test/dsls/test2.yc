conversation test2 {
  type Dto {
  }
  agent obj concerning Dto {
    privately receives signal
    receives stop
    sends sync

    initially receives signal -> running > sync
    {
      terminated {
      }
      running {
        stop -> terminated
      }
    }
  }
  agent control concerning Dto {
    privately receives stop

    initially receives obj.sync -> controlling
    {
      controlling {
        stop -> ^end > obj.stop
      }
      ^end {
      }
    }
  }
}
