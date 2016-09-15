conversation test5 {
  type obj {
  }
  type control {
  }
  type sync {
    String control
  }
  type stop {
    String obj
  }
  agent obj concerning obj {
    privately receives signal: sync
    receives stop: stop
    sends sync: sync

    initially receives custom signal -> running > sync {
      terminated {
      }
      custom running {
        custom stop [ stop.obj ] -> terminated
        signal -> terminated
      }
    }
  }
  agent control concerning control {
    privately receives stop: stop
    sends stopping: stop

    initially receives custom obj.sync [ sync.control ] -> controlling {
      decision controlling {
        custom stop -> stopping > stopping
      }
      decision stopping {
        custom stop -> ^end > obj.stop
      }
      ^end {
      }
    }
  }

  agent other concerning obj {
    initially becomes first {
      first {
        receives custom control.stopping [ stop.obj ] -> last
      }
      last {
      }
    }
  }
}
