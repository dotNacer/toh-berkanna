import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BattleEventsComponent } from './battle-events.component';

describe('BattleEventsComponent', () => {
  let component: BattleEventsComponent;
  let fixture: ComponentFixture<BattleEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattleEventsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BattleEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
