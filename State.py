from enum import IntEnum
import inspect

class TYPE(IntEnum):
  DEFAULT = 1
  FOUND_AP = 2  # AP = augmenting path
  IMP_LAB = 3 # improved labelings 

class State():
  def __init__(self, type):
    self.type = int(type)

  def serialize(self):
    return [p for p in inspect.getmembers(self) if not p[0].startswith('_') and  not inspect.ismethod(p[1])]

class Def_State(State):  # default
  def __init__(self, type, labels, matching):
    super().__init__(type)
    self.labels = labels[:] # python is default assign with reference
    self.matching = matching[:]
  
  def print(self):
    print("{}, labels={}, matching={}".format(self.type, self.labels, self.matching))


class AP_State(State):  # augmenting path
  def __init__(self, type, path):
    super().__init__(type)
    self.path = path[:]
  
  def print(self):
    print("{}, path={}".format(self.type, self.path))


class Imp_Lab_State(State):  # improved labelings 
  def __init__(self, type, new_labels):
    super().__init__(type)
    self.new_labels = new_labels[:]

  def print(self):
    print("{}, new_labels={}".format(self.type, self.new_labels))
