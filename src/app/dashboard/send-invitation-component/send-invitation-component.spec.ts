import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendInvitationComponent } from './send-invitation-component';

describe('SendInvitationComponentComponent', () => {
  let component: SendInvitationComponent;
  let fixture: ComponentFixture<SendInvitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendInvitationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendInvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
